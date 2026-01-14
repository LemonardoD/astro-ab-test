import { dict } from "./dict";

export const multilang = dict.strict(["de"], {
  title: {
    en: "Multilingual Page",
    de: "Mehrsprachige Seite"
  },
  text: {
    en: "This page tests language variants.",
    de: "Diese Seite testet Sprachvarianten."
  },
  sub_title: {
    en: "Language Options",
    de: "Sprachoptionen"
  },
  sub_text: {
    en: "Many",
    de: "Viele"
  }
});

export const multilangVariantB = dict.strict([], {
  title: {
    en: "New text"
  },
  text: {
    en: "Completly different text"
  }
});
