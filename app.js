if(process.env.NODE_ENV != "production") {
    require('dotenv').config();
}

require('dotenv').config({ override: true, quiet: true });
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride  = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/expressError.js");
const session = require("express-session");
const MongoStore = require('connect-mongo');
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");

// Routers 
const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");

app.set("view engine", "ejs");
app.set("views", path.join(__dirname,"/views"));
app.use(express.urlencoded({extended: true}));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "public")));

// const MONGO_URL = "mongodb://127.0.0.1:27017/tripNest";
const dbUrl = process.env.ATLASDB_URL;

main().then(() => {
    console.log("Connceted to DB");
})
.catch((err) => {
    console.log(err);
});

 async function main() {
    await mongoose.connect(dbUrl);
}

const store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto: {
        secret: process.env.SECRECT,
    },
    touchAfter: 24 * 3600,
});
 
store.on("error", () => {
    console.log("ERROR in MONGO SESSION STORE", err);
});

const sessionOptions = {
    store,
    secret: process.env.SECRECT,
    resave: false,
    saveUninitialized: true,
    cookie: {
        exprires: Date.now() * 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true
    },
};

// Home page
// app.get("/", (req, res) => {
//     res.send("I am groot");
// });



// Session and flash Middlewares
app.use(session(sessionOptions));
app.use(flash());

// User Authentication 
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

// Static serialize and deserialize the users into session
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currentUser = req.user;
    next();
});


// // Demo User
// app.get("/demouser",async (req, res) => {
//     let fakeuser = new User({
//         email: "student2gmail.com",
//         username: "student",
//     });
//     let newUser = await User.register(fakeuser, "helloworld");
//     res.send(newUser);
// });

// Routers Implemented
app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter);

app.all(/.*/, (req, res, next) => {
    next(new ExpressError(404, "Page Not Found!"));
});

// Error defining
app.use((err, req, res, next) => {
    let {statusCode=500, message="Something Went Wrong!"} = err;
    res.status(statusCode).render("error.ejs", { message });
    // res.status(statusCode).send(message);
});

// port setup
app.listen(8080, () => {
    console.log("Server is listening to the port");
});

