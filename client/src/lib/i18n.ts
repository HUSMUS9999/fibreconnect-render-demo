export type Lang = 'fr' | 'de' | 'en';

const translations: Record<string, Record<Lang, string>> = {
  // General
  'app.title': { fr: 'FibreConnect Europe', de: 'FibreConnect Europe', en: 'FibreConnect Europe' },
  'app.subtitle': { fr: 'Gestion des Interventions Fibre Optique', de: 'Glasfaser-Interventionsmanagement', en: 'Fiber Optic Intervention Management' },
  'common.save': { fr: 'Enregistrer', de: 'Speichern', en: 'Save' },
  'common.cancel': { fr: 'Annuler', de: 'Abbrechen', en: 'Cancel' },
  'common.delete': { fr: 'Supprimer', de: 'Löschen', en: 'Delete' },
  'common.edit': { fr: 'Modifier', de: 'Bearbeiten', en: 'Edit' },
  'common.create': { fr: 'Créer', de: 'Erstellen', en: 'Create' },
  'common.search': { fr: 'Rechercher...', de: 'Suchen...', en: 'Search...' },
  'common.filter': { fr: 'Filtrer', de: 'Filtern', en: 'Filter' },
  'common.all': { fr: 'Tous', de: 'Alle', en: 'All' },
  'common.confirm': { fr: 'Confirmer', de: 'Bestätigen', en: 'Confirm' },
  'common.close': { fr: 'Fermer', de: 'Schließen', en: 'Close' },
  'common.loading': { fr: 'Chargement...', de: 'Laden...', en: 'Loading...' },
  'common.not_specified': { fr: 'Non renseigné', de: 'Nicht angegeben', en: 'Not specified' },
  'common.error': { fr: 'Erreur', de: 'Fehler', en: 'Error' },
  'common.success': { fr: 'Succès', de: 'Erfolg', en: 'Success' },
  'common.yes': { fr: 'Oui', de: 'Ja', en: 'Yes' },
  'common.no': { fr: 'Non', de: 'Nein', en: 'No' },

  // Auth
  'auth.login': { fr: 'Connexion', de: 'Anmeldung', en: 'Login' },
  'auth.email': { fr: 'Email', de: 'E-Mail', en: 'Email' },
  'auth.password': { fr: 'Mot de passe', de: 'Passwort', en: 'Password' },
  'auth.logout': { fr: 'Déconnexion', de: 'Abmelden', en: 'Logout' },

  // Navigation
  'nav.dashboard': { fr: 'Tableau de bord', de: 'Dashboard', en: 'Dashboard' },
  'nav.interventions': { fr: 'Interventions', de: 'Interventionen', en: 'Interventions' },
  'nav.planning': { fr: 'Planification', de: 'Planung', en: 'Planning' },
  'nav.technicians': { fr: 'Techniciens', de: 'Techniker', en: 'Technicians' },
  'nav.clients': { fr: 'Clients', de: 'Kunden', en: 'Clients' },
  'nav.users': { fr: 'Utilisateurs', de: 'Benutzer', en: 'Users' },
  'nav.sla': { fr: 'SLA & Retards', de: 'SLA & Verspätungen', en: 'SLA & Delays' },
  'nav.notifications': { fr: 'Notifications', de: 'Benachrichtigungen', en: 'Notifications' },

  // Countries
  'country.FR': { fr: 'France', de: 'Frankreich', en: 'France' },
  'country.DE': { fr: 'Allemagne', de: 'Deutschland', en: 'Germany' },
  'country.BE': { fr: 'Belgique', de: 'Belgien', en: 'Belgium' },
  'country.LU': { fr: 'Luxembourg', de: 'Luxemburg', en: 'Luxembourg' },

  // Status
  'status.en_attente': { fr: 'En attente', de: 'Wartend', en: 'Pending' },
  'status.planifiee_auto': { fr: 'Planifiée auto', de: 'Auto geplant', en: 'Auto planned' },
  'status.confirmee': { fr: 'Confirmée', de: 'Bestätigt', en: 'Confirmed' },
  'status.en_cours': { fr: 'En cours', de: 'In Bearbeitung', en: 'In progress' },
  'status.en_retard': { fr: 'En retard', de: 'Verspätet', en: 'Delayed' },
  'status.reportee': { fr: 'Reportée', de: 'Verschoben', en: 'Postponed' },
  'status.finalisee': { fr: 'Finalisée', de: 'Abgeschlossen', en: 'Completed' },
  'status.annulee': { fr: 'Annulée', de: 'Storniert', en: 'Cancelled' },

  // Types
  'type.installation_fibre': { fr: 'Installation fibre', de: 'Glasfaser-Installation', en: 'Fiber installation' },
  'type.depannage': { fr: 'Dépannage', de: 'Fehlerbehebung', en: 'Troubleshooting' },
  'type.maintenance': { fr: 'Maintenance', de: 'Wartung', en: 'Maintenance' },
  'type.raccordement': { fr: 'Raccordement', de: 'Anschluss', en: 'Connection' },
  'type.soudure': { fr: 'Soudure', de: 'Schweißen', en: 'Splicing' },
  'type.tirage_cable': { fr: 'Tirage câble', de: 'Kabelverlegung', en: 'Cable pulling' },
  'type.audit_technique': { fr: 'Audit technique', de: 'Technisches Audit', en: 'Technical audit' },
  'type.mise_en_service': { fr: 'Mise en service', de: 'Inbetriebnahme', en: 'Commissioning' },

  // Priority
  'priority.critique': { fr: 'Critique', de: 'Kritisch', en: 'Critical' },
  'priority.haute': { fr: 'Haute', de: 'Hoch', en: 'High' },
  'priority.normale': { fr: 'Normale', de: 'Normal', en: 'Normal' },
  'priority.basse': { fr: 'Basse', de: 'Niedrig', en: 'Low' },

  // Roles
  'role.super_admin': { fr: 'Super Admin Europe', de: 'Super Admin Europa', en: 'Super Admin Europe' },
  'role.admin_pays': { fr: 'Admin Pays', de: 'Länder-Admin', en: 'Country Admin' },
  'role.superviseur': { fr: 'Superviseur', de: 'Supervisor', en: 'Supervisor' },
  'role.technicien': { fr: 'Technicien', de: 'Techniker', en: 'Technician' },

  // Intervention
  'intervention.new': { fr: 'Nouvelle intervention', de: 'Neue Intervention', en: 'New intervention' },
  'intervention.type': { fr: "Type d'intervention", de: 'Interventionstyp', en: 'Intervention type' },
  'intervention.description': { fr: 'Description', de: 'Beschreibung', en: 'Description' },
  'intervention.client': { fr: 'Client', de: 'Kunde', en: 'Client' },
  'intervention.address': { fr: 'Adresse', de: 'Adresse', en: 'Address' },
  'intervention.city': { fr: 'Ville', de: 'Stadt', en: 'City' },
  'intervention.country': { fr: 'Pays', de: 'Land', en: 'Country' },
  'intervention.priority': { fr: 'Priorité', de: 'Priorität', en: 'Priority' },
  'intervention.sla': { fr: 'SLA (heures)', de: 'SLA (Stunden)', en: 'SLA (hours)' },
  'intervention.deadline': { fr: 'Date limite', de: 'Frist', en: 'Deadline' },
  'intervention.technician': { fr: 'Technicien', de: 'Techniker', en: 'Technician' },
  'intervention.date': { fr: 'Date planifiée', de: 'Geplantes Datum', en: 'Scheduled date' },
  'intervention.time': { fr: 'Horaire', de: 'Zeitfenster', en: 'Time slot' },
  'intervention.status': { fr: 'Statut', de: 'Status', en: 'Status' },
  'intervention.history': { fr: 'Historique', de: 'Verlauf', en: 'History' },
  'intervention.replan': { fr: 'Replanifier', de: 'Umplanen', en: 'Reschedule' },
  'intervention.manual_assign': { fr: 'Attribution manuelle', de: 'Manuelle Zuweisung', en: 'Manual assign' },

  // Dashboard
  'dashboard.total': { fr: 'Total interventions', de: 'Gesamt Interventionen', en: 'Total interventions' },
  'dashboard.active': { fr: 'Actives', de: 'Aktive', en: 'Active' },
  'dashboard.delayed': { fr: 'En retard', de: 'Verspätet', en: 'Delayed' },
  'dashboard.sla_rate': { fr: 'Taux SLA', de: 'SLA-Rate', en: 'SLA rate' },
  'dashboard.by_country': { fr: 'Par pays', de: 'Nach Land', en: 'By country' },
  'dashboard.performance': { fr: 'Performance techniciens', de: 'Techniker-Leistung', en: 'Technician performance' },
  'dashboard.real_time': { fr: 'Temps réel', de: 'Echtzeit', en: 'Real-time' },

  // Client portal
  'client.welcome': { fr: 'Suivi de votre intervention', de: 'Verfolgung Ihrer Intervention', en: 'Track your intervention' },
  'client.confirm_date': { fr: 'Confirmer la date', de: 'Datum bestätigen', en: 'Confirm date' },
  'client.reschedule': { fr: 'Replanifier', de: 'Umplanen', en: 'Reschedule' },
  'client.cancel_intervention': { fr: "Annuler l'intervention", de: 'Intervention stornieren', en: 'Cancel intervention' },
  'client.add_comment': { fr: 'Ajouter un commentaire', de: 'Kommentar hinzufügen', en: 'Add a comment' },
  'client.rate_service': { fr: 'Noter le service', de: 'Service bewerten', en: 'Rate service' },
  'client.tech_on_way': { fr: 'Technicien en route', de: 'Techniker unterwegs', en: 'Technician on the way' },
  'client.tech_nearby': { fr: 'Technicien proche !', de: 'Techniker in der Nähe!', en: 'Technician nearby!' },
  'client.eta': { fr: "Arrivée estimée", de: 'Voraussichtliche Ankunft', en: 'Estimated arrival' },
  'client.completed': { fr: 'Intervention terminée', de: 'Intervention abgeschlossen', en: 'Intervention completed' },

  // Demo placeholders
  'client.demo_name': { fr: 'Client Démo', de: 'Demo-Kunde', en: 'Demo Client' },

  // History / events
  'action.creation': { fr: 'Création', de: 'Erstellung', en: 'Created' },
  'action.planification_auto': { fr: 'Planification automatique', de: 'Automatische Planung', en: 'Auto planning' },
  'action.replanification': { fr: 'Replanification', de: 'Umplanung', en: 'Rescheduled' },
  'action.attribution_manuelle': { fr: 'Attribution manuelle', de: 'Manuelle Zuweisung', en: 'Manual assignment' },
  'action.modification': { fr: 'Modification', de: 'Änderung', en: 'Updated' },
  'action.annulation': { fr: 'Annulation', de: 'Stornierung', en: 'Cancelled' },
  'action.demarrage': { fr: 'Démarrage', de: 'Start', en: 'Started' },
  'action.finalisation': { fr: 'Finalisation', de: 'Abschluss', en: 'Completed' },
  'action.sla_violation': { fr: 'Dépassement SLA', de: 'SLA-Verstoß', en: 'SLA violation' },
  'action.confirmation_client': { fr: 'Confirmation client', de: 'Kundenbestätigung', en: 'Client confirmation' },
  'action.replanification_client': { fr: 'Demande de replanification', de: 'Umplanungsanfrage', en: 'Reschedule request' },
  'action.annulation_client': { fr: 'Annulation client', de: 'Kundenstornierung', en: 'Client cancellation' },
  'action.commentaire_client': { fr: 'Commentaire client', de: 'Kundenkommentar', en: 'Client comment' },

  // Delay categories
  'delay.trafic': { fr: 'Trafic', de: 'Verkehr', en: 'Traffic' },
  'delay.client_absent': { fr: 'Client absent', de: 'Kunde abwesend', en: 'Client absent' },
  'delay.probleme_technique': { fr: 'Problème technique', de: 'Technisches Problem', en: 'Technical issue' },
  'delay.meteo': { fr: 'Météo', de: 'Wetter', en: 'Weather' },
  'delay.materiel': { fr: 'Matériel', de: 'Material', en: 'Equipment' },
  'delay.autre': { fr: 'Autre', de: 'Sonstiges', en: 'Other' },

  // Technician certifications / skills
  'cert.fibre_optique': { fr: 'Fibre optique', de: 'Glasfaser', en: 'Fiber optics' },
  'cert.soudure': { fr: 'Soudure', de: 'Spleißen', en: 'Splicing' },
  'cert.ftth': { fr: 'FTTH', de: 'FTTH', en: 'FTTH' },
};

let currentLang: Lang = 'fr';

export function setLanguage(lang: Lang) {
  currentLang = lang;
  localStorage.setItem('lang', lang);
}

export function getLanguage(): Lang {
  return (localStorage.getItem('lang') as Lang) || currentLang;
}

export function t(key: string, lang?: Lang): string {
  const l = lang || getLanguage();
  return translations[key]?.[l] || translations[key]?.['fr'] || key;
}

export function getCountryName(code: string, lang?: Lang): string {
  return t(`country.${code}`, lang);
}

export function getStatusLabel(status: string, lang?: Lang): string {
  return t(`status.${status}`, lang);
}

export function getTypeLabel(type: string, lang?: Lang): string {
  return t(`type.${type}`, lang);
}

export function getPriorityLabel(priority: string, lang?: Lang): string {
  return t(`priority.${priority}`, lang);
}

export function getRoleLabel(role: string, lang?: Lang): string {
  return t(`role.${role}`, lang);
}

export function humanizeKey(raw: string): string {
  const key = String(raw || '').trim();
  if (!key) return '';

  const acronyms = new Set(['sla', 'gps', 'id', 'api']);
  const parts = key.replace(/[-_]+/g, ' ').split(' ').filter(Boolean);
  return parts
    .map((p) => {
      const lower = p.toLowerCase();
      if (acronyms.has(lower)) return lower.toUpperCase();
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ');
}

export function getActionLabel(action: string, lang?: Lang): string {
  const k = `action.${action}`;
  const translated = translations[k]?.[lang || getLanguage()];
  return translated || translations[k]?.fr || humanizeKey(action);
}

export function getDelayCategoryLabel(category: string, lang?: Lang): string {
  const k = `delay.${category}`;
  const translated = translations[k]?.[lang || getLanguage()];
  return translated || translations[k]?.fr || humanizeKey(category);
}

export function getTechnicianTagLabel(tag: string, lang?: Lang): string {
  const raw = String(tag || '').trim();
  if (!raw) return '';

  // Common normalization for stored values
  const normalized = raw.toLowerCase();
  const certKey = `cert.${normalized}`;
  if (translations[certKey]) {
    return t(certKey, lang);
  }

  // If it matches an intervention type, reuse that label
  const typeKey = `type.${raw}`;
  if (translations[typeKey]) {
    return t(typeKey, lang);
  }

  return humanizeKey(raw);
}
