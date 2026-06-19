export async function analyzeSEO(args) {
  const { content, target_keyword } = args;

  const plainText = content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const wordCount = plainText.split(/\s+/).length;
  const lowerContent = plainText.toLowerCase();
  const lowerKeyword = target_keyword.toLowerCase();

  // Keyword density
  const keywordMatches = (lowerContent.match(new RegExp(lowerKeyword, "g")) || []).length;
  const keywordDensity = ((keywordMatches / wordCount) * 100).toFixed(2);

  // Başlık kontrolü
  const hasH1 = /<h1/i.test(content) || content.includes("# ");
  const hasH2 = /<h2/i.test(content) || content.includes("## ");
  const hasH3 = /<h3/i.test(content) || content.includes("### ");
  const keywordInTitle = lowerContent.substring(0, 200).includes(lowerKeyword);
  const hasFAQ = lowerContent.includes("faq") || lowerContent.includes("sık sorulan") || lowerContent.includes("frequently asked");

  const checks = [
    { check: "Kelime sayısı yeterli (>600)", pass: wordCount > 600, value: `${wordCount} kelime` },
    { check: "Anahtar kelime yoğunluğu (%1-3)", pass: keywordDensity >= 1 && keywordDensity <= 3, value: `%${keywordDensity}` },
    { check: "H1 başlık var", pass: hasH1 },
    { check: "H2 başlıklar var", pass: hasH2 },
    { check: "H3 başlıklar var", pass: hasH3 },
    { check: "Anahtar kelime ilk paragrafta", pass: keywordInTitle },
    { check: "FAQ bölümü var", pass: hasFAQ },
  ];

  const score = Math.round((checks.filter((c) => c.pass).length / checks.length) * 100);

  const suggestions = checks
    .filter((c) => !c.pass)
    .map((c) => `⚠️ ${c.check}${c.value ? ` (${c.value})` : ""}`);

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({
          seo_score: score,
          grade: score >= 80 ? "A" : score >= 60 ? "B" : score >= 40 ? "C" : "D",
          word_count: wordCount,
          keyword_density: `%${keywordDensity}`,
          keyword_count: keywordMatches,
          checks,
          suggestions,
          message: score >= 70
            ? `✅ SEO skoru iyi (${score}/100). Yayınlamaya hazır.`
            : `⚠️ SEO skoru düşük (${score}/100). İyileştirme önerileri var.`,
        }, null, 2),
      },
    ],
  };
}
