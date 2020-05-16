const fs = require("fs");
const http = require("http");
const { randomBytes } = require("crypto");
const https = require("https");
const path = require("path");
var express = require("express");
var router = express.Router();
const multer = require("multer");

// GALLERY MIDDLEWARE

const galleryDispley = (req, res, next) => {
  const files = [];
  const imgUploads = path.join(__dirname, "../public/images/uploads");
  const imgDownloads = path.join(__dirname, "../public/images/downloads");
  fs.readdir(imgUploads, (err, dirContent) => {
    if (err) throw err;
    dirContent.forEach((img) => {
      files.push("/images/uploads/" + img);
    });

    fs.readdir(imgDownloads, (err, dirContent) => {
      if (err) throw err;
      dirContent.forEach((img) => {
        files.push("/images/downloads/" + img);
      });
      res.locals.fileNames = files;
      next();
    });
  });
};

router.use("/", galleryDispley);

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { title: "Express" });
});
// multer upload destination
const upload = multer({ dest: "public/images/uploads" });

// router to handle uploads  upload.single middleware 1 param the name of input="file"
router.post("/fileupload", upload.single("file"), (req, res, next) => {
  // you have file info at req.file
  // res.send(req.file);
  res.redirect("/");
});

// upload miltiple files
router.post(
  "/uploadmultiplefiles",
  upload.fields([
    { name: "mFile1", maxCount: 1 },
    { name: "mFile2", maxCount: 1 },
  ]),
  (req, res, next) => {
    // you can access the file info with req.files
    // res.send(req.files);
    res.redirect("/");
  }
);
// DOWNLOAD PHOTOS FORM URL
router.post("/downloadFile", (req, res, next) => {
  const validTypes = { "image/jpeg": 0, "image/png": 0 };
  const url = req.body.fileUrl;
  const fileDownload = (response) => {
    if (!(response.headers["content-type"] in validTypes)) {
      return res.send("We only support jpg jpeg and png");
    }
    const randomName = randomBytes(5).toString("hex");
    const fileName = path.join(
      __dirname,
      `../public/images/downloads/${randomName}${Date.now()}`
    );
    response.pipe(fs.createWriteStream(fileName)).on("close", () => {
      res.redirect("/");
    });
  };

  // check if the request protocol is http or https
  if (url.slice(0, 4) !== "http") {
    console.log(url.slice(4));
    return res.send("We only do http or https");
  }
  // send different requests to http and htttps
  if (url[4] === "s") {
    const request = https.request(url, fileDownload);
    request.on("error", (error) => {
      console.log("Error! ", error.message);
    });
    request.end();
  } else {
    const request = http.request(url, fileDownload);
    request.on("error", (error) => {
      console.log("Error! ", error.message);
    });
    request.end();
  }
});

module.exports = router;
