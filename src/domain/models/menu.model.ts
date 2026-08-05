export interface MenuItem {
  id: number;
  title: string;
  url: string | null;
  icon: string | null;
  requiredPermission: string | null;
  parentMenuId: number | null;
  children: MenuItem[] | null;
}

export type MenuItems = MenuItem[];
