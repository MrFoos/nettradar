"""Røyktester for backend-en.

Repoet har ingen enhetstester, og deploy går rett i produksjon ved merge til
main. Disse testene finnes for å fange den vanligste feilkilden vi faktisk
har: en avhengighetsbump som brekker noe. De kjører uten nettverk — alt
utgående arbeid ligger i `lifespan`, som ikke kjøres her.
"""

import importlib
import inspect

import pydantic
import pytest
from fastapi import FastAPI


@pytest.fixture(scope="module")
def app() -> FastAPI:
    """Selve importen er halve testen: den brekker hvis fastapi eller
    pydantic endrer noe vi er avhengige av."""
    return importlib.import_module("backend.main").app


def test_app_er_bygget(app):
    assert isinstance(app, FastAPI)
    assert app.title == "Nettradar"


def test_forventede_ruter_finnes(app):
    """Vi leser rutene ut av OpenAPI-skjemaet, ikke ut av `app.routes`.

    FastAPI 0.141 sluttet å kopiere ruter fra include_router() flatt inn i
    app.routes. Her defineres alt med @app.get, så det spiller ingen rolle
    i dag — men skjemaet er den stabile kontrakten, og det holder testen
    ærlig hvis rutene senere flyttes til en router.
    """
    stier = set(app.openapi()["paths"])
    # Sidene brukerne faktisk lander på. Forsvinner en av disse har noe
    # brukket i rutingen, ikke bare i en test.
    for sti in ("/", "/ddos", "/bgp", "/tilgjengelighet", "/om", "/topologi"):
        assert sti in stier, f"ruten {sti} er borte — fant {sorted(stier)}"


def test_websocket_ruten_finnes(app):
    # BGP-strømmen går over denne. Den er grunnen til at websockets-bumper
    # er verdt å teste.
    assert any(getattr(r, "path", None) == "/ws" for r in app.routes)


def test_alle_modeller_genererer_schema():
    """Pydantic-bumper brekker typisk her, ikke ved import."""
    models = importlib.import_module("backend.models")
    funnet = [
        obj
        for _, obj in inspect.getmembers(models, inspect.isclass)
        if issubclass(obj, pydantic.BaseModel) and obj is not pydantic.BaseModel
    ]
    assert funnet, "fant ingen pydantic-modeller — har modulen flyttet?"
    for model in funnet:
        model.model_json_schema()


def test_ripe_klienten_kan_importeres():
    # Trekker inn websockets. Fanger at pakken bytter API under en bump.
    importlib.import_module("backend.ripe_client")
