import { SlugOptions } from './types';

/**
 * Türkçe karakter mapping
 */
const TURKISH_CHARS: Record<string, string> = {
  'ç': 'c',
  'ğ': 'g',
  'ı': 'i',
  'ö': 'o',
  'ş': 's',
  'ü': 'u',
  'Ç': 'C',
  'Ğ': 'G',
  'I': 'I',
  'Ö': 'O',
  'Ş': 'S',
  'Ü': 'U',
};

/**
 * Title'dan slug oluşturur
 * @param title - Haber başlığı
 * @param options - Slug oluşturma seçenekleri
 * @returns SEO-friendly slug
 */
export function createSlug(title: string, options: SlugOptions = {}): string {
  const {
    maxLength = 100,
    separator = '-',
    lowercase = true
  } = options;

  let slug = title
    // Türkçe karakterleri dönüştür
    .replace(/[çğıöşü]/gi, (char) => TURKISH_CHARS[char] || char)
    // Harf ve rakamlar dışındaki karakterleri kaldır
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    // Birden fazla boşluğu tek boşluğa çevir
    .replace(/\s+/g, ' ')
    // Boşlukları separator ile değiştir
    .replace(/\s/g, separator);

  if (lowercase) {
    slug = slug.toLowerCase();
  }

  // Birden fazla separator'ı tek separator yap
  slug = slug.replace(new RegExp(`${separator}+`, 'g'), separator);

  // Baş ve sondaki separator'ları kaldır
  slug = slug.replace(new RegExp(`^${separator}+|${separator}+$`, 'g'), '');

  // Maksimum uzunluğa kes
  if (slug.length > maxLength) {
    slug = slug.substring(0, maxLength);
    // Son separator'dan sonrasını kes
    const lastSeparatorIndex = slug.lastIndexOf(separator);
    if (lastSeparatorIndex > 0) {
      slug = slug.substring(0, lastSeparatorIndex);
    }
  }

  return slug || 'untitled';
}

/**
 * Unique slug oluşturmak için counter ekler
 * @param baseSlug - Base slug
 * @param existingSlugs - Mevcut slug'lar
 * @returns Unique slug
 */
export function createUniqueSlug(baseSlug: string, existingSlugs: string[] = []): string {
  let slug = baseSlug;
  let counter = 1;

  while (existingSlugs.includes(slug)) {
    const suffix = `-${counter}`;
    const maxLength = 100 - suffix.length;

    if (baseSlug.length > maxLength) {
      slug = baseSlug.substring(0, maxLength) + suffix;
    } else {
      slug = baseSlug + suffix;
    }
    counter++;
  }

  return slug;
}

/**
 * Slug'dan title oluşturur (reverse operation)
 * @param slug - Slug string
 * @returns Human-readable title
 */
export function slugToTitle(slug: string): string {
  return slug
    // Separator'ları boşluğa çevir
    .replace(/-/g, ' ')
    // Her kelimenin ilk harfini büyük yap
    .replace(/\b\w/g, (char) => char.toUpperCase())
    // Birden fazla boşluğu tek boşluğa çevir
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Slug validation
 * @param slug - Test edilecek slug
 * @returns Geçerli slug ise true
 */
export function isValidSlug(slug: string): boolean {
  // Sadece harf, rakam, tire ve alt tire içermeli
  const validPattern = /^[a-zA-Z0-9-_]+$/;
  return validPattern.test(slug) && slug.length > 0 && slug.length <= 512;
}
