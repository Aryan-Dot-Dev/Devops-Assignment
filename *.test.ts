import { expect, describe, it, beforeAll, afterAll } from "bun:test";

const BASE_URL = `http://localhost:${process.env.PORT || 3000}`;

describe("Todo API", () => {
  describe("GET /health", () => {
    it("should return status ok with database connection", async () => {
      const res = await fetch(`${BASE_URL}/health`);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.status).toBe("ok");
      expect(body.database).toBeDefined();
    });

    it("should have correct content-type", async () => {
      const res = await fetch(`${BASE_URL}/health`);
      expect(res.headers.get("content-type")).toContain("application/json");
    });
  });

  describe("GET /todos", () => {
    it("should return empty array initially", async () => {
      const res = await fetch(`${BASE_URL}/todos`);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(Array.isArray(body)).toBe(true);
    });
  });

  describe("POST /todos", () => {
    it("should create a new todo with title and default done=false", async () => {
      const res = await fetch(`${BASE_URL}/todos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Test Todo" }),
      });

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.id).toBeDefined();
      expect(body.title).toBe("Test Todo");
      expect(body.done).toBe(false);
    });

    it("should create a todo with explicit done=true", async () => {
      const res = await fetch(`${BASE_URL}/todos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Completed Task", done: true }),
      });

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.done).toBe(true);
    });

    it("should reject missing title with 400", async () => {
      const res = await fetch(`${BASE_URL}/todos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done: false }),
      });

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain("title");
    });

    it("should reject non-string title with 400", async () => {
      const res = await fetch(`${BASE_URL}/todos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: 123 }),
      });

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain("string");
    });
  });

  describe("PUT /todos/:id", () => {
    let todoId: number;

    beforeAll(async () => {
      const res = await fetch(`${BASE_URL}/todos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Update Test" }),
      });
      const body = await res.json();
      todoId = body.id;
    });

    it("should update todo title", async () => {
      const res = await fetch(`${BASE_URL}/todos/${todoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Updated Title" }),
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.title).toBe("Updated Title");
    });

    it("should update todo done status", async () => {
      const res = await fetch(`${BASE_URL}/todos/${todoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done: true }),
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.done).toBe(true);
    });

    it("should return 404 for non-existent todo", async () => {
      const res = await fetch(`${BASE_URL}/todos/99999`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Nope" }),
      });

      expect(res.status).toBe(404);
    });

    it("should reject invalid done type with 400", async () => {
      const res = await fetch(`${BASE_URL}/todos/${todoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done: "not a boolean" }),
      });

      expect(res.status).toBe(400);
    });
  });

  describe("DELETE /todos/:id", () => {
    let todoId: number;

    beforeAll(async () => {
      const res = await fetch(`${BASE_URL}/todos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Delete Test" }),
      });
      const body = await res.json();
      todoId = body.id;
    });

    it("should delete a todo and return it", async () => {
      const res = await fetch(`${BASE_URL}/todos/${todoId}`, {
        method: "DELETE",
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.id).toBe(todoId);
    });

    it("should return 404 when deleting non-existent todo", async () => {
      const res = await fetch(`${BASE_URL}/todos/99999`, {
        method: "DELETE",
      });

      expect(res.status).toBe(404);
    });
  });
});