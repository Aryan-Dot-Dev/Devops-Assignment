interface Todo {
  id: number;
  title: string;
  done: boolean;
}

let todos: Todo[] = [];
let nextId = 1;

const PORT = parseInt(process.env.PORT || "3000");

const server = Bun.serve({
  port: PORT,
  async fetch(req: Request) {
    const url = new URL(req.url);
    const pathname = url.pathname;
    const method = req.method;

    // GET /health
    if (method === "GET" && pathname === "/health") {
      return Response.json({ status: "ok" });
    }

    // GET /todos
    if (method === "GET" && pathname === "/todos") {
      return Response.json(todos);
    }

    // POST /todos
    if (method === "POST" && pathname === "/todos") {
      const { title, done } = await req.json();

      if (!title || typeof title !== "string") {
        return Response.json(
          { error: "title is required and must be a string" },
          { status: 400 }
        );
      }

      const todo: Todo = {
        id: nextId++,
        title,
        done: done ?? false,
      };

      todos.push(todo);
      return Response.json(todo, { status: 201 });
    }

    // PUT /todos/:id
    if (method === "PUT" && pathname.startsWith("/todos/")) {
      const id = parseInt(pathname.split("/")[2]);
      const { title, done } = await req.json();

      const todo = todos.find((t) => t.id === id);
      if (!todo) {
        return Response.json({ error: "Todo not found" }, { status: 404 });
      }

      if (title !== undefined) {
        if (typeof title !== "string") {
          return Response.json({ error: "title must be a string" }, { status: 400 });
        }
        todo.title = title;
      }

      if (done !== undefined) {
        if (typeof done !== "boolean") {
          return Response.json({ error: "done must be a boolean" }, { status: 400 });
        }
        todo.done = done;
      }

      return Response.json(todo);
    }

    // DELETE /todos/:id
    if (method === "DELETE" && pathname.startsWith("/todos/")) {
      const id = parseInt(pathname.split("/")[2]);

      const index = todos.findIndex((t) => t.id === id);
      if (index === -1) {
        return Response.json({ error: "Todo not found" }, { status: 404 });
      }

      const deleted = todos.splice(index, 1);
      return Response.json(deleted[0]);
    }

    return Response.json({ error: "Not found" }, { status: 404 });
  },
});

console.log(`Server running on http://localhost:${server.port}`);// test
