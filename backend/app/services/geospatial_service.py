"""GeoJSON <-> PostGIS conversion, geometry validation, and authoritative
spatial measurements (area, perimeter, centroid).

Design: the frontend (Mapbox GL Draw + Turf.js) computes area/perimeter/
centroid client-side purely for immediate user feedback in the Review
step. Those client-computed numbers are NEVER trusted or persisted as-is.
This module recomputes them authoritatively from the stored PostGIS
geometry using geography-cast spatial functions, which is what actually
gets written to the database and returned to the client.
"""

import json
from typing import Any

from geoalchemy2.shape import from_shape, to_shape
from shapely.geometry import Polygon, mapping, shape
from shapely.geometry.base import BaseGeometry
from geoalchemy2.types import Geography
from sqlalchemy import bindparam, cast, func, select
from sqlalchemy.orm import Session

SRID = 4326


class InvalidGeometryError(ValueError):
    """Raised when a client-submitted geometry fails validation.

    The message is always safe to show directly to end users — never
    wraps a raw PostGIS/database error message.
    """


def geojson_to_shape(geojson: dict[str, Any]) -> BaseGeometry:
    """Validates a GeoJSON Polygon payload and converts it to a Shapely
    geometry. Raises `InvalidGeometryError` with a user-friendly message
    on any structural problem — never lets a raw parser/PostGIS exception
    escape to the caller.
    """
    if not isinstance(geojson, dict):
        raise InvalidGeometryError("Invalid site boundary. Please redraw the polygon.")

    if geojson.get("type") != "Polygon":
        raise InvalidGeometryError("Invalid site boundary. Please redraw the polygon.")

    coordinates = geojson.get("coordinates")
    if not coordinates or not isinstance(coordinates, list) or len(coordinates) == 0:
        raise InvalidGeometryError("Invalid site boundary. Please redraw the polygon.")

    outer_ring = coordinates[0]
    if not isinstance(outer_ring, list) or len(outer_ring) < 4:
        # A closed polygon ring needs at least 4 positions (3 distinct
        # vertices + closing point repeating the first).
        raise InvalidGeometryError("Invalid site boundary. Please redraw the polygon.")

    if outer_ring[0] != outer_ring[-1]:
        raise InvalidGeometryError("Invalid site boundary. The polygon must be closed. Please redraw it.")

    try:
        geom = shape(geojson)
    except (ValueError, TypeError, AttributeError) as exc:
        raise InvalidGeometryError("Invalid site boundary. Please redraw the polygon.") from exc

    if not isinstance(geom, Polygon):
        raise InvalidGeometryError("Invalid site boundary. Please redraw the polygon.")

    if geom.is_empty:
        raise InvalidGeometryError("Invalid site boundary. The polygon is empty. Please redraw it.")

    if not geom.is_valid:
        raise InvalidGeometryError(
            "Invalid site boundary. The polygon self-intersects or is malformed. Please redraw it."
        )

    if geom.area == 0:
        raise InvalidGeometryError("Invalid site boundary. The polygon has zero area. Please redraw it.")

    return geom


def shape_to_geojson(geom: BaseGeometry) -> dict[str, Any]:
    """Converts a Shapely geometry (as read back from PostGIS) into a
    plain GeoJSON-compatible dict for the API response.
    """
    return mapping(geom)


def wkb_to_geojson(wkb_geometry: Any) -> dict[str, Any]:
    """Converts a GeoAlchemy2 WKBElement (as loaded from the `sites.geometry`
    column) into a standard GeoJSON dict.
    """
    return shape_to_geojson(to_shape(wkb_geometry))


def shape_to_ewkt_element(geom: BaseGeometry):
    """Converts a Shapely geometry into a GeoAlchemy2 element ready to be
    assigned to a `Geometry` mapped column, tagged with SRID 4326.
    """
    return from_shape(geom, srid=SRID)


class GeometrySummary:
    """Authoritative spatial measurements computed by PostGIS."""

    __slots__ = ("area_hectares", "perimeter_km", "centroid_lat", "centroid_lon")

    def __init__(self, area_hectares: float, perimeter_km: float, centroid_lat: float, centroid_lon: float):
        self.area_hectares = area_hectares
        self.perimeter_km = perimeter_km
        self.centroid_lat = centroid_lat
        self.centroid_lon = centroid_lon


def compute_geometry_summary(db: Session, geom: BaseGeometry) -> GeometrySummary:
    """Uses PostGIS spatial functions (via a lightweight scalar query) to
    authoritatively compute area (hectares), perimeter (km), and centroid
    (lat/lon) for a polygon. The geometry is passed in as WKT via a bound
    parameter (never string-interpolated into SQL) and parsed server-side
    with `ST_GeomFromText`. Area/perimeter are computed on a `geography`
    cast so PostGIS returns geodesic (great-circle) measurements in square
    meters / meters rather than planar degrees.
    """
    wkt_param = bindparam("wkt", value=geom.wkt)
    geom_expr = func.ST_SetSRID(func.ST_GeomFromText(wkt_param), SRID)
    geography_expr = cast(geom_expr, Geography)

    stmt = select(
        (func.ST_Area(geography_expr) / 10000.0).label("area_hectares"),
        (func.ST_Perimeter(geography_expr) / 1000.0).label("perimeter_km"),
        func.ST_Y(func.ST_Centroid(geom_expr)).label("centroid_lat"),
        func.ST_X(func.ST_Centroid(geom_expr)).label("centroid_lon"),
    )
    row = db.execute(stmt).one()

    return GeometrySummary(
        area_hectares=round(float(row.area_hectares), 2),
        perimeter_km=round(float(row.perimeter_km), 3),
        centroid_lat=round(float(row.centroid_lat), 6),
        centroid_lon=round(float(row.centroid_lon), 6),
    )


def geojson_dict_to_json_str(geojson: dict[str, Any]) -> str:
    return json.dumps(geojson)
