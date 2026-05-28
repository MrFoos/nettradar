from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class BGPEvent(BaseModel):
    prefix: str
    as_path: list[int]
    peer_asn: int
    event_type: str  # "announcement" | "withdrawal" | "hijack"
    timestamp: float
    asn_name: Optional[str] = None
    matched_no_asns: list[int] = []


class AttackDataPoint(BaseModel):
    timestamp: str
    value: float


class HijackAlert(BaseModel):
    prefix: str
    hijacker_asn: int
    victim_asn: int
    detected_at: str


class TrafficAnomaly(BaseModel):
    type: str
    location: str
    description: str
    start_time: str
    status: str


class OutageEvent(BaseModel):
    id: str
    location: str
    asn: Optional[int] = None
    asn_name: Optional[str] = None
    start_time: str
    end_time: Optional[str] = None
    type: str
    description: Optional[str] = None


class TrafficAnomalyEvent(BaseModel):
    id: str
    location: Optional[str] = None
    asn: Optional[int] = None
    asn_name: Optional[str] = None
    start_time: str
    end_time: Optional[str] = None
    type: str
    status: str
    score: Optional[float] = None


class AttackOrigin(BaseModel):
    country_code: str
    country_name: str
    percentage: float


class AttackASOrigin(BaseModel):
    as_number: int
    as_name: str
    percentage: float


class RouteLeak(BaseModel):
    prefix: str
    leak_asn: int
    origin_asn: int
    peer_asn: int
    detected_at: str


class RadarState(BaseModel):
    attack_timeseries: list[AttackDataPoint] = []
    layer3_timeseries: list[AttackDataPoint] = []
    hijack_alerts: list[HijackAlert] = []
    route_leaks: list[RouteLeak] = []
    anomalies: list[TrafficAnomaly] = []
    attack_origins: list[AttackOrigin] = []
    attack_origins_l3: list[AttackOrigin] = []
    attack_as_origins: list[AttackASOrigin] = []
    active_outages: list[OutageEvent] = []
    traffic_anomaly_events: list[TrafficAnomalyEvent] = []
    last_updated: Optional[float] = None
    attack_baseline_24h: float = 0.0
    current_attack_intensity: float = 0.0
