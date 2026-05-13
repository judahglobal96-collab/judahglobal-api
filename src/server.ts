import app from "./app,js";

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Judah Global API running on port ${PORT}`);
});