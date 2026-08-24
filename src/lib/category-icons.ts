import {
  UtensilsCrossed,
  Car,
  Gamepad2,
  FileText,
  Banknote,
  HelpCircle,
  ShoppingCart,
  Coffee,
  Home,
  Wifi,
  Lightbulb,
  Heart,
  GraduationCap,
  Plane,
  Gift,
  Music,
  Dumbbell,
  PawPrint,
  Baby,
  Wrench,
  type LucideIcon,
} from 'lucide-react'

const ICON_MAP: Record<string, LucideIcon> = {
  UtensilsCrossed,
  Car,
  Gamepad2,
  FileText,
  Banknote,
  HelpCircle,
  ShoppingCart,
  Coffee,
  Home,
  Wifi,
  Lightbulb,
  Heart,
  GraduationCap,
  Plane,
  Gift,
  Music,
  Dumbbell,
  PawPrint,
  Baby,
  Wrench,
}

export function getCategoryIcon(iconName: string | null): LucideIcon {
  if (!iconName) return HelpCircle
  return ICON_MAP[iconName] || HelpCircle
}
