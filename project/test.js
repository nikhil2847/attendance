require("dotenv").config();
const express = require("express");
const app = express();
const port = process.env.PORT || 3333;
const cors = require(`cors`);
const bodyParser = require("body-parser");
const sequelize = require("./db");

const adminUserRoutes = require("./routes/adminUserRoutes");
const menuMasert = require("./routes/menuRoutes.js");
const menuLKRoutes = require("./routes/menuLK.routes.js");
const Sales_PaymentScheduleRoutes = require("./routes/Sales_PaymentScheduleRoutes.js");
const subscriptionRouter = require("./routes/subscriptionRouter.js");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
    cors({
        methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    })
);
//routes  ----
app.use("/api/admin-users", adminUserRoutes);
app.use("/api/dashboard", dashboardRoutes);


app.use("/api/calllogs", callLogsRouter);
app.use("/api/sales-schedule", Sales_PaymentScheduleRoutes);
app.use("/api/subscription", subscriptionRouter);
// Define a simple test route
app.get("/tester", (req, res) => {
    res.send("Hello World!");
});

sequelize
    .sync()
    .then(() => {
        app.listen(port, () => {
            console.log(`Server listening on port ${port}`);
        });
    })
    .catch((err) => {
        console.error("Database sync error:", err);
    });