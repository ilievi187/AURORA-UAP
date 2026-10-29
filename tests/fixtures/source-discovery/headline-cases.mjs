const older = "2026-10-20T08:00:00.000Z";
const newer = "2026-10-28T08:00:00.000Z";

export const headlineCases = [
  {
    name: "same title from Google News and the publisher keeps the publisher URL",
    items: [
      {title: "Pentagon releases UAP video", url: "https://news.google.com/rss/articles/abc", source: "Google News", published: newer},
      {title: "Pentagon releases UAP video", url: "https://www.example.com/uap-video", source: "Example Press", published: older}
    ],
    expectUrls: ["https://www.example.com/uap-video"]
  },
  {
    name: "punctuation, case, and spacing do not make a second story",
    items: [
      {title: "UAP hearing opens", url: "https://www.example.com/a", source: "Example Press", published: older},
      {title: "  UAP   hearing opens! ", url: "https://www.example.com/b", source: "Example Press", published: newer}
    ],
    expectUrls: ["https://www.example.com/b"]
  },
  {
    name: "tracking parameters do not make a second copy",
    items: [
      {title: "AARO publishes annual report", url: "https://www.example.com/report?id=9", source: "Example Press", published: older},
      {title: "Different headline for the same report", url: "https://www.example.com/report?id=9&utm_source=rss&fbclid=1&ref=rss", source: "Example Press", published: newer}
    ],
    expectUrls: ["https://www.example.com/report?id=9"]
  },
  {
    name: "distinct hearings both remain",
    items: [
      {title: "UAP hearing opens", url: "https://www.example.com/opens", source: "Example Press", published: newer},
      {title: "UAP hearing delayed", url: "https://www.example.com/delayed", source: "Example Press", published: older}
    ],
    expectUrls: ["https://www.example.com/opens", "https://www.example.com/delayed"]
  },
  {
    name: "Cyrillic case and Latin accents collapse only the same story",
    items: [
      {title: "Свидетели съобщават за НЛО", url: "https://www.example.bg/1", source: "Пример", published: older},
      {title: "свидетели съобщават за нло", url: "https://www.example.bg/2", source: "Пример", published: newer},
      {title: "Fenómeno aéreo no identificado", url: "https://www.example.es/1", source: "Ejemplo", published: older},
      {title: "Fenomeno aereo no identificado", url: "https://www.example.es/2", source: "Ejemplo", published: newer},
      {title: "Неопознан обект край река", url: "https://www.example.bg/reka", source: "Пример", published: older},
      {title: "Неопознан обект край рекй", url: "https://www.example.bg/reki", source: "Пример", published: newer}
    ],
    expectUrls: ["https://www.example.bg/2", "https://www.example.es/2", "https://www.example.bg/reki", "https://www.example.bg/reka"]
  }
];
