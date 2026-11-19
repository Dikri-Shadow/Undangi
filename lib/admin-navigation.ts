export function isAdminNavItemActive(pathname: string, href: string, exact = false): boolean {
  if (exact) return pathname === href;
  if (href === "/admin/invitations") {
    return pathname === href || (pathname.startsWith(`${href}/`) && pathname !== `${href}/new` && !pathname.startsWith(`${href}/new/`));
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
