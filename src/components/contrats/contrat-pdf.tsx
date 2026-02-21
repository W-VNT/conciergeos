import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

Font.register({
  family: "Helvetica",
  fonts: [],
});

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    paddingTop: 50,
    paddingBottom: 60,
    paddingHorizontal: 50,
    color: "#1a1a1a",
    lineHeight: 1.5,
  },
  // En-tête
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#1a1a1a",
  },
  orgName: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
  },
  orgCity: {
    fontSize: 10,
    color: "#555",
    marginTop: 2,
  },
  docTitle: {
    textAlign: "right",
  },
  docTitleMain: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
  },
  docTitleSub: {
    fontSize: 9,
    color: "#555",
    marginTop: 3,
  },
  // Parties
  partiesContainer: {
    flexDirection: "row",
    gap: 20,
    marginBottom: 28,
    backgroundColor: "#f8f8f8",
    padding: 14,
    borderRadius: 4,
  },
  partyBlock: {
    flex: 1,
  },
  partyLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    color: "#888",
    letterSpacing: 1,
    marginBottom: 5,
  },
  partyName: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    marginBottom: 3,
  },
  partyDetail: {
    fontSize: 9,
    color: "#444",
    marginBottom: 1,
  },
  partySeparator: {
    width: 1,
    backgroundColor: "#ddd",
    marginVertical: 2,
  },
  // Articles
  article: {
    marginBottom: 16,
  },
  articleTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    marginBottom: 5,
    paddingBottom: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: "#ccc",
  },
  articleBody: {
    fontSize: 9.5,
    lineHeight: 1.6,
    color: "#333",
    textAlign: "justify",
  },
  bulletItem: {
    flexDirection: "row",
    marginBottom: 2,
    paddingLeft: 8,
  },
  bullet: {
    width: 12,
    fontSize: 9.5,
  },
  bulletText: {
    flex: 1,
    fontSize: 9.5,
    lineHeight: 1.5,
    color: "#333",
  },
  exclusifBox: {
    backgroundColor: "#fff8e6",
    borderLeftWidth: 3,
    borderLeftColor: "#e6a817",
    padding: 8,
    marginTop: 6,
    marginBottom: 4,
  },
  exclusifText: {
    fontSize: 9.5,
    color: "#7a5200",
    lineHeight: 1.5,
  },
  // Signatures
  signaturesSection: {
    marginTop: 30,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#ccc",
  },
  signaturesTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    color: "#888",
    letterSpacing: 0.8,
    marginBottom: 16,
  },
  signaturesRow: {
    flexDirection: "row",
    gap: 30,
  },
  signatureBlock: {
    flex: 1,
  },
  signatureLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    color: "#888",
    marginBottom: 4,
  },
  signatureName: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    marginBottom: 2,
  },
  signatureRole: {
    fontSize: 9,
    color: "#555",
    marginBottom: 20,
  },
  signatureLine: {
    height: 1,
    backgroundColor: "#999",
    marginBottom: 4,
  },
  signatureLineLabel: {
    fontSize: 8,
    color: "#aaa",
  },
  // Footer
  footer: {
    position: "absolute",
    bottom: 30,
    left: 50,
    right: 50,
    textAlign: "center",
    fontSize: 8,
    color: "#aaa",
    borderTopWidth: 0.5,
    borderTopColor: "#ddd",
    paddingTop: 8,
  },
});

export interface ContratPDFData {
  contrat: {
    id: string;
    type: string;
    start_date: string;
    end_date: string;
    commission_rate: number;
    status: string;
    conditions: string | null;
  };
  proprietaire: {
    full_name: string;
    address_line1: string | null;
    postal_code: string | null;
    city: string | null;
    statut_juridique?: string | null;
    siret?: string | null;
    email?: string | null;
    phone?: string | null;
  } | null;
  logement: {
    name: string;
    address_line1: string | null;
    postal_code: string | null;
    city: string | null;
  } | null;
  organisation: {
    name: string;
    city: string | null;
    address_line1?: string | null;
    postal_code?: string | null;
    siret?: string | null;
    phone?: string | null;
    email?: string | null;
    statut_juridique?: string | null;
  };
}

function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    timeZone: "Europe/Paris",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function ContratPDF({ contrat, proprietaire, logement, organisation }: ContratPDFData) {
  const isExclusif = contrat.type === "EXCLUSIF";
  const today = new Date().toLocaleDateString("fr-FR", {
    timeZone: "Europe/Paris",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const bienDescription = logement
    ? `le bien immobilier suivant : ${logement.name}${logement.address_line1 ? `, situé ${logement.address_line1}${logement.postal_code ? `, ${logement.postal_code}` : ""}${logement.city ? ` ${logement.city}` : ""}` : ""}`
    : "l'ensemble des biens immobiliers appartenant au mandant";

  return (
    <Document
      title={`Contrat de gestion - ${proprietaire?.full_name ?? "Propriétaire"}`}
      author={organisation.name}
      creator="ConciergeOS"
    >
      <Page size="A4" style={styles.page}>
        {/* En-tête */}
        <View style={styles.header}>
          <View>
            <Text style={styles.orgName}>{organisation.name}</Text>
            {organisation.statut_juridique && (
              <Text style={styles.orgCity}>{organisation.statut_juridique}{organisation.siret ? ` — SIRET ${organisation.siret}` : ""}</Text>
            )}
            {!organisation.statut_juridique && organisation.siret && (
              <Text style={styles.orgCity}>SIRET {organisation.siret}</Text>
            )}
            {organisation.address_line1 && (
              <Text style={styles.orgCity}>{organisation.address_line1}{organisation.postal_code || organisation.city ? `, ${[organisation.postal_code, organisation.city].filter(Boolean).join(" ")}` : ""}</Text>
            )}
            {!organisation.address_line1 && organisation.city && (
              <Text style={styles.orgCity}>{organisation.city}</Text>
            )}
          </View>
          <View style={styles.docTitle}>
            <Text style={styles.docTitleMain}>
              Mandat de gestion{"\n"}touristique
            </Text>
            <Text style={styles.docTitleSub}>
              {isExclusif ? "Mandat exclusif" : "Mandat simple"}
            </Text>
            <Text style={styles.docTitleSub}>
              Réf. {contrat.id.slice(0, 8).toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Parties */}
        <View style={styles.partiesContainer}>
          <View style={styles.partyBlock}>
            <Text style={styles.partyLabel}>Le Mandataire</Text>
            <Text style={styles.partyName}>{organisation.name}</Text>
            {organisation.statut_juridique && (
              <Text style={styles.partyDetail}>{organisation.statut_juridique}</Text>
            )}
            {organisation.address_line1 && (
              <Text style={styles.partyDetail}>{organisation.address_line1}</Text>
            )}
            {(organisation.postal_code || organisation.city) && (
              <Text style={styles.partyDetail}>
                {[organisation.postal_code, organisation.city].filter(Boolean).join(" ")}
              </Text>
            )}
            {organisation.siret && (
              <Text style={styles.partyDetail}>SIRET : {organisation.siret}</Text>
            )}
            {organisation.email && (
              <Text style={styles.partyDetail}>{organisation.email}</Text>
            )}
            {organisation.phone && (
              <Text style={styles.partyDetail}>{organisation.phone}</Text>
            )}
            <Text style={styles.partyDetail}>
              Ci-après dénommé « le Mandataire »
            </Text>
          </View>
          <View style={styles.partySeparator} />
          <View style={styles.partyBlock}>
            <Text style={styles.partyLabel}>Le Mandant (Propriétaire)</Text>
            <Text style={styles.partyName}>{proprietaire?.full_name ?? "—"}</Text>
            {proprietaire?.address_line1 && (
              <Text style={styles.partyDetail}>{proprietaire.address_line1}</Text>
            )}
            {(proprietaire?.postal_code || proprietaire?.city) && (
              <Text style={styles.partyDetail}>
                {[proprietaire.postal_code, proprietaire.city].filter(Boolean).join(" ")}
              </Text>
            )}
            {proprietaire?.statut_juridique && proprietaire.statut_juridique !== "PARTICULIER" && (
              <Text style={styles.partyDetail}>{proprietaire.statut_juridique}{proprietaire.siret ? ` — SIRET ${proprietaire.siret}` : ""}</Text>
            )}
            {proprietaire?.email && (
              <Text style={styles.partyDetail}>{proprietaire.email}</Text>
            )}
            <Text style={styles.partyDetail}>
              Ci-après dénommé « le Mandant »
            </Text>
          </View>
        </View>

        {/* Article 1 - Objet */}
        <View style={styles.article}>
          <Text style={styles.articleTitle}>Article 1 — Objet du mandat</Text>
          <Text style={styles.articleBody}>
            Le Mandant confie au Mandataire, qui accepte, la gestion locative saisonnière de {bienDescription}. Le Mandataire est autorisé à effectuer toutes les démarches nécessaires à la mise en location touristique du bien, notamment la création et la gestion des annonces en ligne, la réception des paiements et la remise des clés aux voyageurs.
          </Text>
        </View>

        {/* Article 2 - Durée */}
        <View style={styles.article}>
          <Text style={styles.articleTitle}>Article 2 — Durée</Text>
          <Text style={styles.articleBody}>
            Le présent mandat est consenti pour une durée déterminée du {fmt(contrat.start_date)} au {fmt(contrat.end_date)}. À l'issue de cette période, il prendra fin de plein droit, sauf renouvellement express des parties. En cas de reconduction tacite, un préavis de 30 jours par lettre recommandée avec accusé de réception sera nécessaire pour y mettre fin.
          </Text>
        </View>

        {/* Article 3 - Obligations mandataire */}
        <View style={styles.article}>
          <Text style={styles.articleTitle}>Article 3 — Missions du Mandataire</Text>
          <Text style={styles.articleBody}>Dans le cadre du présent mandat, le Mandataire s'engage à :</Text>
          {[
            "Assurer la mise en ligne et la gestion des annonces sur les plateformes de location touristique (Airbnb, Booking.com, etc.)",
            "Gérer les réservations, la relation avec les voyageurs et les éventuelles réclamations",
            "Organiser et superviser le ménage, la remise en état du logement et le linge entre chaque séjour",
            "Accueillir les voyageurs sur place ou organiser un accueil autonome sécurisé (boîte à clé, serrure connectée)",
            "Assurer une permanence téléphonique pour les voyageurs durant leur séjour",
            "Remettre mensuellement au Mandant un récapitulatif des réservations et des revenus générés",
            "Signaler au Mandant tout sinistre ou dégradation constatés dans les meilleurs délais",
          ].map((item, i) => (
            <View key={i} style={styles.bulletItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>{item}</Text>
            </View>
          ))}
        </View>

        {/* Article 4 - Obligations mandant */}
        <View style={styles.article}>
          <Text style={styles.articleTitle}>Article 4 — Obligations du Mandant</Text>
          <Text style={styles.articleBody}>Le Mandant s'engage à :</Text>
          {[
            "Mettre à disposition du Mandataire le logement dans un état propre, sûr et en bon état de fonctionnement",
            "Informer le Mandataire de toute période d'indisponibilité du logement avec un préavis minimum de 15 jours",
            "Régler toutes les charges afférentes au logement (charges de copropriété, taxe foncière, assurances, abonnements, etc.)",
            "Souscrire une assurance multirisques habitation couvrant expressément les locations saisonnières",
            "Déclarer les revenus locatifs auprès des administrations compétentes selon la réglementation en vigueur",
            "Fournir au Mandataire tous les documents nécessaires à l'exercice de son mandat (diagnostics, règlement de copropriété, etc.)",
          ].map((item, i) => (
            <View key={i} style={styles.bulletItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>{item}</Text>
            </View>
          ))}
        </View>

        {/* Article 5 - Rémunération */}
        <View style={styles.article}>
          <Text style={styles.articleTitle}>Article 5 — Rémunération</Text>
          <Text style={styles.articleBody}>
            En contrepartie des services rendus, le Mandataire percevra une commission de {contrat.commission_rate}% HT calculée sur le montant brut des loyers encaissés, toutes charges comprises. Cette commission sera déduite directement des sommes encaissées par le Mandataire avant reversement au Mandant. Le reversement interviendra dans un délai de 30 jours suivant la clôture de chaque mois civil, accompagné d'un relevé détaillé des réservations.{"\n\n"}
            Les frais exceptionnels (réparations urgentes, remplacement d'équipements, etc.) feront l'objet d'une facturation séparée après accord préalable du Mandant, sauf en cas d'urgence avérée.
          </Text>
        </View>

        {/* Article 6 - Résiliation */}
        <View style={styles.article}>
          <Text style={styles.articleTitle}>Article 6 — Résiliation</Text>
          <Text style={styles.articleBody}>
            Le présent mandat peut être résilié par l'une ou l'autre des parties, moyennant un préavis de 30 jours adressé par lettre recommandée avec avis de réception. En cas de manquement grave d'une partie à ses obligations contractuelles, non réparé dans un délai de 15 jours suivant mise en demeure, le présent contrat pourra être résilié sans préavis par l'autre partie.{"\n\n"}
            En cas de résiliation anticipée à l'initiative du Mandant, les réservations déjà confirmées à la date de résiliation seront honorées par le Mandataire jusqu'à leur terme, et les commissions correspondantes lui restent dues.
          </Text>
        </View>

        {/* Article 7 - Exclusivité (si applicable) */}
        {isExclusif && (
          <View style={styles.article}>
            <Text style={styles.articleTitle}>Article 7 — Exclusivité</Text>
            <View style={styles.exclusifBox}>
              <Text style={styles.exclusifText}>
                Le présent mandat est consenti à titre exclusif. Le Mandant s'interdit formellement de confier la gestion locative saisonnière de son bien à tout autre prestataire ou d'effectuer lui-même des mises en location touristique, pendant toute la durée du mandat, sans accord préalable et écrit du Mandataire. Tout manquement à cette clause ouvrirait droit pour le Mandataire à des dommages et intérêts correspondant aux commissions qu'il aurait perçues.
              </Text>
            </View>
          </View>
        )}

        {/* Article 8 (ou 7 si pas exclusif) - Conditions particulières */}
        {contrat.conditions && (
          <View style={styles.article}>
            <Text style={styles.articleTitle}>
              Article {isExclusif ? "8" : "7"} — Conditions particulières
            </Text>
            <Text style={styles.articleBody}>{contrat.conditions}</Text>
          </View>
        )}

        {/* Article final - Droit applicable */}
        <View style={styles.article}>
          <Text style={styles.articleTitle}>
            Article {isExclusif ? (contrat.conditions ? "9" : "8") : (contrat.conditions ? "8" : "7")} — Droit applicable et juridiction compétente
          </Text>
          <Text style={styles.articleBody}>
            Le présent contrat est soumis au droit français. Toute contestation relative à son interprétation ou à son exécution sera portée, à défaut de règlement amiable, devant les juridictions compétentes du lieu du bien immobilier objet du présent mandat, ou à défaut, du siège social du Mandataire.
          </Text>
        </View>

        {/* Signatures */}
        <View style={styles.signaturesSection}>
          <Text style={styles.signaturesTitle}>
            Fait à {organisation.city ?? "___________"}, le {today}
          </Text>
          <View style={styles.signaturesRow}>
            <View style={styles.signatureBlock}>
              <Text style={styles.signatureLabel}>Le Mandataire</Text>
              <Text style={styles.signatureName}>{organisation.name}</Text>
              <Text style={styles.signatureRole}>Représentant légal</Text>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureLineLabel}>Signature et cachet</Text>
            </View>
            <View style={styles.signatureBlock}>
              <Text style={styles.signatureLabel}>Le Mandant</Text>
              <Text style={styles.signatureName}>{proprietaire?.full_name ?? "—"}</Text>
              <Text style={styles.signatureRole}>Propriétaire</Text>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureLineLabel}>Signature précédée de « Lu et approuvé »</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          {organisation.name} — Mandat de gestion touristique — {isExclusif ? "Exclusif" : "Simple"} — Réf. {contrat.id.slice(0, 8).toUpperCase()} — Généré le {today}
        </Text>
      </Page>
    </Document>
  );
}
