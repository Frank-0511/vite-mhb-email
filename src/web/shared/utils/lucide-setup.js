/**
 * @file Lucide Icons setup and initialization
 * Centralizes Lucide icon setup for all pages
 */

import {
  ArrowLeft,
  BookOpen,
  CheckCircle,
  Clock,
  Copy,
  createIcons,
  Dna,
  Eye,
  FileOutput,
  FileText,
  List,
  Moon,
  Package,
  Rocket,
  Save,
  Sun,
  Zap,
} from "lucide";

/**
 * Icon names that should be available across the app
 * @type {Record<string, Function>}
 */
const AVAILABLE_ICONS = {
  ArrowLeft,
  BookOpen,
  CheckCircle,
  Clock,
  Copy,
  Dna,
  Eye,
  FileOutput,
  FileText,
  List,
  Moon,
  Package,
  Rocket,
  Save,
  Sun,
  Zap,
};

/**
 * Initialize Lucide icons on the page.
 * Should be called after DOM updates that introduce new [data-lucide] elements.
 *
 * @returns {void}
 */
export function initLucideIcons() {
  createIcons({
    icons: AVAILABLE_ICONS,
  });
}
