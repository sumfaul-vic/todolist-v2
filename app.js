//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require('lodash');


const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

//mongo/mongoose
// mongoose.connect("mongodb://localhost:27017/todolistDB");
mongoose.connect("mongodb+srv://admin-victoria:gpcLp@cluster0.nzlqq.mongodb.net/todolistDB");


//schemas
const itemsSchema = new mongoose.Schema({
  name: String
});

const listSchema = {
  name: String,
  items : [itemsSchema]
}

//model
const Item = mongoose.model("Item", itemsSchema);
const List = mongoose.model("List", listSchema)

//created some items
const item1 = new Item({
  name: "Welcome to your to-do list!"
});
const item2 = new Item({
  name: "Hit the + button to add a new item."
});
const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

//array of items
const defaultItems = [item1, item2, item3];

app.get("/", function(req, res) {
  //get items from mongodb
  Item.find({}, function(err, foundItems) {

    if (foundItems.length === 0) {
      // insert these into mongodb
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Items inserted.");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", {
        listTitle: "Today",
        newListItems: foundItems
      });
    }
  });
});

app.get("/:customListName", function(req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({
    name: customListName
  }, function(err, foundList){
    if(!err){
      if(!foundList){
        //Create a new List
        const list = new List({
          name: customListName,
          items: defaultItems
        });

        list.save();
        res.redirect("/" + customListName);
      } else {
        //Show an existing List
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items
        });
      }
    };
  });
});

app.post("/", function(req, res) {
  const newItem = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: newItem
  });

  if(listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({
      name: listName
    },
      function(err, foundList){
        foundList.items.push(item);
        foundList.save();
        res.redirect("/" + listName);
    });
  }
});

app.post("/delete", function(req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
if (listName === "Today") {
  Item.findByIdAndRemove(checkedItemId,
    function(err) {
      if (err) {
        console.log(err);
      } else {
        console.log("deleted");
      }
    });

  res.redirect("/");
} else {
  List.findOneAndUpdate({
      name: listName
    }, {
      $pull: {
        items: {
          _id: checkedItemId
        }
      }
    },
    function(err, results) {
      if (!err) {
        console.log("Item Deleted");
        res.redirect("/" + listName);
      }
    }
  );
}


});



app.get("/about", function(req, res) {
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server started successfully");
});
