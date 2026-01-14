// ============================================================================
// Astro i18n Dictionary
// API: dict.strict(["de", "it"], { ... }) with staticPaths() and use(Astro)
// ============================================================================

// ============================================================================
// Type Utilities
// ============================================================================

type Simplify<T> = { [K in keyof T]: T[K] } & {};

type ExtractUsedParams<S extends string> = S extends `${string}::${infer Param}::${infer Rest}` ? Param | ExtractUsedParams<Rest> : never;

type HasParams<S extends string> = S extends `${string}::${string}` ? true : false;

type TranslationFn<Params extends readonly string[]> = Params["length"] extends 0
  ? () => string
  : (params: Simplify<{ [K in Params[number]]: string }>) => string;

// ============================================================================
// Validation Types
// ============================================================================

type ValidateString<S extends string | null, DeclaredParams extends readonly string[]> = S extends null
  ? true
  : S extends string
  ? DeclaredParams["length"] extends 0
    ? HasParams<S> extends true
      ? `Undeclared param: ${ExtractUsedParams<S>}`
      : true
    : Exclude<ExtractUsedParams<S>, DeclaredParams[number]> extends never
    ? true
    : `Undeclared param: ${Exclude<ExtractUsedParams<S>, DeclaredParams[number]>}`
  : true;

type ExtraKeys<T, Locales extends string> = Exclude<keyof T, "en" | "params" | Locales>;

type ValidEntry<T, Locales extends string> = (T extends {
  params?: infer P;
  en: infer En;
}
  ? P extends readonly string[]
    ? {
        params: P;
        en: ValidateString<En & string, P> extends true ? string : ValidateString<En & string, P>;
      } & {
        [L in Locales]: T extends Record<L, infer V>
          ? ValidateString<V & (string | null), P> extends true
            ? string | null
            : ValidateString<V & (string | null), P>
          : string | null;
      } & {
        [K in ExtraKeys<T, Locales>]?: never;
      }
    : {
        en: ValidateString<En & string, []> extends true ? string : ValidateString<En & string, []>;
      } & {
        [L in Locales]: T extends Record<L, infer V>
          ? ValidateString<V & (string | null), []> extends true
            ? string | null
            : ValidateString<V & (string | null), []>
          : string | null;
      } & {
        [K in ExtraKeys<T, Locales>]?: never;
      }
  : { en: string } & { [L in Locales]: string | null } & {
      [K in ExtraKeys<T, Locales>]?: never;
    }) & {};

type ValidSchema<T, Locales extends string> = {
  [Key in keyof T]: ValidEntry<T[Key], Locales>;
};

type GetParams<T> = T extends { params: infer P } ? (P extends readonly string[] ? P : readonly []) : readonly [];

// ============================================================================
// Compiled Dictionary Type
// ============================================================================

type Translations<T> = {
  [Key in keyof T]: TranslationFn<GetParams<T[Key]>>;
};

type AstroPage<T, Locales extends string> = {
  /** For Astro's getStaticPaths */
  staticPaths: () => { params: { lang: string | undefined } }[];

  /** Get translations for current request */
  use(astro: { params: Record<string, string | undefined> }): {
    t: Translations<T>;
    lang: Locales | "en";
    locales: readonly (Locales | "en")[];
  };

  /** Manual locale switching */
  $use<L extends Locales | "en">(locale: L): Translations<T>;

  /** All supported locales including "en" */
  locales: readonly (Locales | "en")[];
};

// ============================================================================
// Runtime
// ============================================================================

type EntryShape = {
  params?: readonly string[];
  en: string;
} & Record<string, string | null | readonly string[] | undefined>;

type CompiledEntry = {
  declaredParams: readonly string[];
  templates: Record<string, string>;
};

function validateAndCompileEntry(
  key: string,
  entry: EntryShape,
  locales: readonly string[]
): { errors: string[]; declaredParams: readonly string[] } {
  const errors: string[] = [];
  const declaredParams = entry.params ?? [];
  const declaredParamsSet = new Set(declaredParams);

  const validateString = (str: string | null, locale: string) => {
    if (str === null) return;
    const usedParams = [...str.matchAll(/::(\w+)::/g)].map((m) => m[1]!);
    for (const param of usedParams) {
      if (!declaredParamsSet.has(param)) {
        errors.push(`[${key}.${locale}] Undeclared param "::${param}::". Declared: [${declaredParams.join(", ")}]`);
      }
    }
  };

  validateString(entry.en, "en");
  for (const locale of locales) {
    if (locale in entry) {
      validateString(entry[locale] as string | null, locale);
    }
  }

  return { errors, declaredParams };
}

function interpolate(template: string, declaredParams: readonly string[], params: Record<string, string> = {}): string {
  for (const p of declaredParams) {
    if (!(p in params)) {
      throw new Error(`Missing required parameter: "${p}"`);
    }
  }
  for (const k of Object.keys(params)) {
    if (!declaredParams.includes(k)) {
      throw new Error(`Unknown parameter: "${k}". Valid: ${[...declaredParams].join(", ") || "(none)"}`);
    }
  }
  return template.replace(/::(\w+)::/g, (_, k: string) => params[k]!);
}

function compileEntries(
  entries: Record<string, EntryShape>,
  locales: readonly string[]
): { compiled: Record<string, CompiledEntry>; errors: string[] } {
  const compiled: Record<string, CompiledEntry> = {};
  const allErrors: string[] = [];

  for (const [key, entry] of Object.entries(entries)) {
    const { errors, declaredParams } = validateAndCompileEntry(key, entry, locales);
    allErrors.push(...errors);

    const templates: Record<string, string> = { en: entry.en };
    for (const locale of locales) {
      templates[locale] = (entry[locale] as string | null) ?? entry.en;
    }

    compiled[key] = { declaredParams, templates };
  }

  return { compiled, errors: allErrors };
}

function createTranslations<T>(compiled: Record<string, CompiledEntry>, locale: string): Translations<T> {
  const translations: Record<string, unknown> = {};

  for (const [key, entry] of Object.entries(compiled)) {
    translations[key] = (params?: Record<string, string>) => {
      const template = entry.templates[locale] ?? entry.templates["en"]!;
      return interpolate(template, entry.declaredParams, params);
    };
  }

  return translations as Translations<T>;
}

// ============================================================================
// Public API
// ============================================================================

export const dict = {
  /**
   * Create a page dictionary with strict type validation.
   *
   * @example
   * export const home = dict.strict(["de", "it"], {
   *   title: { en: "Welcome", de: "Willkommen", it: "Benvenuto" },
   *   greeting: {
   *     params: ["name"],
   *     en: "Hello ::name::",
   *     de: "Hallo ::name::",
   *     it: "Ciao ::name::",
   *   },
   * });
   *
   * // In Astro page:
   * export const getStaticPaths = home.staticPaths;
   * const { t, lang } = home.use(Astro);
   */
  strict<const Locales extends readonly string[], const T extends ValidSchema<T, Locales[number]>>(
    locales: Locales,
    entries: T
  ): AstroPage<T, Locales[number]> {
    const allLocales = ["en", ...locales] as const;

    const { compiled, errors } = compileEntries(entries as Record<string, EntryShape>, locales);

    if (errors.length > 0) {
      throw new Error(`Translation validation errors:\n${errors.join("\n")}`);
    }

    return {
      locales: allLocales as readonly (Locales[number] | "en")[],

      staticPaths() {
        return allLocales.map((lang) => ({
          params: { lang: lang === "en" ? undefined : lang }
        }));
      },

      use(astro) {
        const lang = (astro.params.lang ?? "en") as Locales[number] | "en";
        return {
          t: createTranslations<T>(compiled, lang),
          lang,
          locales: allLocales as readonly (Locales[number] | "en")[]
        };
      },

      $use(locale) {
        return createTranslations<T>(compiled, locale);
      }
    };
  }
};
