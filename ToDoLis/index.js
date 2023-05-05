const express = require("express");
const bodyparser = require("body-parser");
const date = require(__dirname + "/date.js")
const mongoose = require("mongoose")

const app = express();
app.use(bodyparser.urlencoded({ extended: true }));
app.use(express.static("public"));

main().catch(err => console.log(err));
async function main() {
    await mongoose.connect("mongodb://0.0.0.0:27017/todolistDB")
}

const taskSchema = new mongoose.Schema({
    content: String
});

const Task = mongoose.model("Task", taskSchema);

const task1 = new Task({
    content: "Welcome to your todolist!"
});

const task2 = new Task({
    content: "Hit the + button to add a new item."
});

const task3 = new Task({
    content: "Hit the checkbox to delete an item"
});

const defaultTasks = [task1, task2, task3];

const listSchema = new mongoose.Schema({
    name: String,
    tasks: [taskSchema]
})

const List = mongoose.model("List", listSchema);

app.set('view engine', 'ejs');
app.get("/", function (req, res) {
    Task.find({}).then(function (foundItems) {
        if (foundItems.length === 0) {
            Task.insertMany(defaultTasks).then(function () {
                console.log("Added items to db");
            }).catch(function (err) {
                console.log(err);
            });
            res.redirect("/")
        }
        let day = date.getDate();
        res.render("list", {
            listTitle: day,
            newTask: foundItems
        })
    }).catch(function (err) {
        console.log(err);
    })

})

app.post("/", function (req, res) {
    let day = date.getDate();
    const itemName = req.body.task;
    const listName = req.body.list;
    const item = new Task({
        content: itemName
    })

    if (listName === day) {
        item.save();
        res.redirect("/")
    } else {
        List.findOne({
            name: listName
        }).then(function (foundList) {
            foundList.tasks.push(item);
            foundList.save();
            res.redirect("/" + listName);
        }).catch(function (err) {
            console.log(err);
        })
    }
});

app.post("/delete", function (req, res) {
    const category = req.body.category;
    const checkedItemID = req.body.checkbox;
    if (category === date.getDate()) {
        Task.findByIdAndRemove(checkedItemID).catch(function (err) {
            console.log(err);
        });
        res.redirect("/");
    } else {
        List.findOneAndUpdate({ name: category }, { $pull: { tasks: { _id: checkedItemID } } }).then(function (foundList) {
            res.redirect("/"+category)
        })
    }
})

app.get("/:category", function (req, res) {
    const category = req.params.category;
    List.findOne({ name: category }).then(function (foundTask) {
        if (!foundTask) {
            const list = new List({
                name: category,
                tasks: defaultTasks
            });
            list.save();
            res.redirect("/" + category);
        } else {
            res.render("list", {
                listTitle: category,
                newTask: foundTask.tasks
            })
        }
    }).catch(function (err) {
        console.log(err);
    })
});

app.get("/about", function (req, res) {
    res.render("about")
})

let PORT = 3000;
app.listen(PORT, function () {
    console.log("Server started on port " + PORT);
})
