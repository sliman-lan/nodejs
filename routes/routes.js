const express = require("express");
const router = express.Router();
const User = require("../models/users");
const multer = require("multer");
const fs = require("fs");
const { ifError } = require("assert");
// image upload
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./uploads");
    },
    filename: function (req, file, cb) {
        cb(null, file.filename + "_" + Date.now() + "_" + file.originalname);
    },
});

var upload = multer({
    storage: storage,
}).single("image");

// insert an user into database
router.post("/add", upload, async (req, res) => {
    const user = new User({
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        image: req.file.filename,
    });
    try {
        await user.save();
        req.session.message = {
            type: "success",
            message: "User Added Successfully",
        };
        res.redirect("/");
    } catch (err) {
        res.json({ message: err.message, type: "danger" });
    }
});

// get all users route
router.get("/", async (req, res) => {
    try {
        const users = await User.find().exec();
        res.render("index", {
            title: "Home Page",
            users: users,
        });
    } catch (err) {
        res.json({ message: err.message });
    }
});
router.get("/add", (req, res) => {
    res.render("add_users", { title: "Add Users" });
});

//  eidt user route
router.get("/edit/:id", async (req, res) => {
    let id = req.params.id;
    try {
        let user = await User.findById(id);
        if (user == null) {
            res.redirect("/");
        } else {
            res.render("edit_users", { title: "Edit User", user: user });
        }
    } catch (err) {
        res.redirect("/");
    }
});

// update user route
router.post("/update/:id", upload, async (req, res) => {
    let id = req.params.id;
    let new_image = "";
    if (req.file) {
        new_image = req.file.filename;
        try {
            fs.unlinkSync("./uploads/" + req.body.old_image);
        } catch (err) {
            console.log(err);
        }
    } else {
        new_image = req.body.old_image;
    }

    try {
        await User.findByIdAndUpdate(id, {
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            image: new_image,
        });
        req.session.message = {
            type: "success",
            message: "User Updated Succesfully",
        };
        res.redirect("/");
    } catch (err) {
        res.json({ message: err.message, type: "danger" });
    }
});

// delete user route
router.get("/delete/:id", async (req, res) => {
    let id = req.params.id;
    try {
        const result = await User.findByIdAndDelete(id);
        if (result.image != "") {
            try {
                fs.unlinkSync("./uploads/" + result.image);
            } catch (err) {
                console.log(err);
            }
        }
        req.session.message = {
            type: "success",
            message: "User Deleted Successfully!",
        };
        res.redirect("/");
    } catch (err) {
        res.json({ message: err.message, type: "danger" });
    }
});
module.exports = router;
