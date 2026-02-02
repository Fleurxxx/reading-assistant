import { db, type Vocabulary } from "./db";

export class VocabularyRepository {
  // Add a word to vocabulary
  async addWord(vocabulary: Omit<Vocabulary, "id" | "addedAt">): Promise<number> {
    return await db.vocabulary.add({
      ...vocabulary,
      addedAt: new Date(),
    });
  }

  // Get all vocabulary words
  async getAll(): Promise<Vocabulary[]> {
    return await db.vocabulary.orderBy("addedAt").reverse().toArray();
  }

  // Get vocabulary by mastery status
  async getByMasteryStatus(mastered: boolean): Promise<Vocabulary[]> {
    return await db.vocabulary
      .where("mastered")
      .equals(mastered ? 1 : 0)
      .toArray();
  }

  // Search vocabulary
  async search(query: string): Promise<Vocabulary[]> {
    const lowerQuery = query.toLowerCase();
    const all = await db.vocabulary.toArray();
    return all.filter(
      (v) =>
        v.word.toLowerCase().includes(lowerQuery) ||
        v.translation.toLowerCase().includes(lowerQuery)
    );
  }

  // Filter by tags
  async getByTag(tag: string): Promise<Vocabulary[]> {
    const all = await db.vocabulary.toArray();
    return all.filter((v) => v.tags.includes(tag));
  }

  // Get all unique tags
  async getAllTags(): Promise<string[]> {
    const all = await db.vocabulary.toArray();
    const tags = new Set<string>();
    all.forEach((v) => v.tags.forEach((t) => tags.add(t)));
    return Array.from(tags).sort();
  }

  // Update mastery status
  async updateMastery(id: number, mastered: boolean): Promise<void> {
    await db.vocabulary.update(id, { mastered });
  }

  // Update vocabulary entry
  async update(id: number, updates: Partial<Vocabulary>): Promise<void> {
    await db.vocabulary.update(id, updates);
  }

  // Delete vocabulary entry
  async delete(id: number): Promise<void> {
    await db.vocabulary.delete(id);
  }

  // Check if word exists in vocabulary
  async exists(word: string): Promise<boolean> {
    const found = await db.vocabulary.where("word").equalsIgnoreCase(word).first();
    return !!found;
  }

  // Get vocabulary count
  async getCount(): Promise<number> {
    return await db.vocabulary.count();
  }

  // Export to CSV
  async exportToCSV(): Promise<string> {
    const all = await this.getAll();
    const headers = ["Word", "Translation", "Mastered", "Tags", "Added Date", "Examples"];
    const rows = all.map((v) => [
      v.word,
      v.translation,
      v.mastered ? "Yes" : "No",
      v.tags.join("; "),
      v.addedAt.toISOString().split("T")[0],
      v.examples.join(" | "),
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    return csv;
  }

  // Clear all vocabulary
  async clearAll(): Promise<void> {
    await db.vocabulary.clear();
  }
}

export const vocabularyRepository = new VocabularyRepository();
