export const CRM_BADGES_REFRESH = 'crm:badges-refresh'

export function requestCrmBadgesRefresh() {
  window.dispatchEvent(new Event(CRM_BADGES_REFRESH))
}
