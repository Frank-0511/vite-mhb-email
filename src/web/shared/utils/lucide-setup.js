/**
 * @file Lucide Icons setup and initialization
 * Centralizes Lucide icon setup for all pages
 */

import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle,
  Clock,
  Copy,
  createIcons,
  Dna,
  Download,
  Eye,
  FileOutput,
  FileText,
  List,
  Moon,
  Package,
  Rocket,
  Save,
  Sun,
  X,
  Zap,
} from "lucide";

/**
 * Icon names that should be available across the app
 * @type {Record<string, Function>}
 */
const AVAILABLE_ICONS = {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle,
  Clock,
  Copy,
  Dna,
  Download,
  Eye,
  FileOutput,
  FileText,
  List,
  Moon,
  Package,
  Rocket,
  Save,
  Sun,
  X,
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
