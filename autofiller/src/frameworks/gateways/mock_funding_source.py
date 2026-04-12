from typing import List

from ...entities.funding_opportunity import FundingOpportunity
from .ifunding_source_gateway import IFundingSourceGateway

class MockFundingSourceGateway(IFundingSourceGateway):
    """
    A mock gateway that returns a set of predefined funding opportunities for testing.
    In a real implementation, this would scrape actual websites or call APIs.
    """
    
    def fetch_opportunities(self) -> List[FundingOpportunity]:
        opportunities = [
            FundingOpportunity(
                title="KI-Förderung für KMU in NRW",
                description="Förderung von Projekten zur Anwendung von Künstlicher Intelligenz in kleinen und mittleren Unternehmen in Nordrhein-Westfalen.",
                funder="Land NRW",
                amount="Bis zu 500.000 EUR",
                deadline="2026-12-31",
                eligibility="KMU mit Sitz in NRW, die ein KI-Projekt durchführen möchten.",
                link="https://foerderportal.nrw.de/ki-kmu",
                source="NRW Förderportal",
                raw_data={},
                industry_tags=["IT", "Künstliche Intelligenz"],
                employee_min=1,
                employee_max=250,
                revenue_min=0,
                revenue_max=50000000,
                location_tags=["NRW"],
                themes=["Digitalisierung", "Innovation", "KI"],
                target_audience="KMU"
            ),
            FundingOpportunity(
                title="Digitalisierungsoffensive Mittelstand",
                description="Zuschüsse zur Digitalisierung von Geschäftsprozessen und Einführung neuer digitaler Technologien im Mittelstand.",
                funder="Bundesministerium für Wirtschaft und Energie",
                amount="Bis zu 200.000 EUR",
                deadline="2026-06-30",
                eligibility="Unternehmen mit weniger als 500 Mitarbeitern.",
                link="https://www.bmwi.de/Redaktion/DE/Dienstleistungen/förderung/digitalisierungsoffensive.html",
                source="BMWi",
                raw_data={},
                industry_tags=["Produktion", "Handel", "Dienstleistungen"],
                employee_min=10,
                employee_max=500,
                revenue_min=0,
                revenue_max=100000000,
                location_tags=["Bundesweit"],
                themes=["Digitalisierung", "Automatisierung", "Industrie 4.0"],
                target_audience="Mittelstand"
            ),
            FundingOpportunity(
                title="Gründungsstipendium Innovative Startups",
                description="Stipendium für Gründerinnen und Gründer mit innovativen Geschäftsideen in der Frühphase.",
                funder="KfW",
                amount="Bis zu 150.000 EUR + Beratung",
                deadline="2026-09-30",
                eligibility="Personen oder Teams, die ein Unternehmen gründen möchten und einen innovativen Geschäftsplan haben.",
                link="https://www.kfw.de/inlandsfoerderung/Unternehmensgruendung/",
                source="KfW",
                raw_data={},
                industry_tags=["Alle"],
                employee_min=1,
                employee_max=10,
                revenue_min=0,
                revenue_max=1000000,
                location_tags=["Bundesweit"],
                themes=["Gründung", "Innovation", "Technologie"],
                target_audience="Startups"
            ),
            FundingOpportunity(
                title="Exportförderung für Unternehmen",
                description="Zuschüsse und Darlehen zur Erschließung neuer Auslandsmärkte und Teilnahme an internationalen Messen.",
                funder="Bundesministerium für Wirtschaft und Klimaschutz",
                amount="Variabel",
                deadline="2026-12-31",
                eligibility="Unternehmerisch tätige Unternehmen mit Sitz in Deutschland.",
                link="https://www.bmwk.de/Redaktion/DE/Artikel/Wirtschaft/exportfoerderung.html",
                source="BMWK",
                raw_data={},
                industry_tags=["Produktion", "Handel"],
                employee_min=1,
                employee_max=2000,
                revenue_min=0,
                revenue_max=1000000000,
                location_tags=["Bundesweit"],
                themes=["Export", "Internationalisierung", "Markterschließung"],
                target_audience="Exporteure"
            )
        ]
        return opportunities