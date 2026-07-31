import { env } from "./config/env";
import { createApp } from "./app";

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`✅ Backend running at http://localhost:${env.PORT}`);
});
