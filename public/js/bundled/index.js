// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles

(function (modules, entry, mainEntry, parcelRequireName, globalName) {
  /* eslint-disable no-undef */
  var globalObject =
    typeof globalThis !== 'undefined'
      ? globalThis
      : typeof self !== 'undefined'
      ? self
      : typeof window !== 'undefined'
      ? window
      : typeof global !== 'undefined'
      ? global
      : {};
  /* eslint-enable no-undef */

  // Save the require from previous bundle to this closure if any
  var previousRequire =
    typeof globalObject[parcelRequireName] === 'function' &&
    globalObject[parcelRequireName];

  var cache = previousRequire.cache || {};
  // Do not use `require` to prevent Webpack from trying to bundle this call
  var nodeRequire =
    typeof module !== 'undefined' &&
    typeof module.require === 'function' &&
    module.require.bind(module);

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire =
          typeof globalObject[parcelRequireName] === 'function' &&
          globalObject[parcelRequireName];
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error("Cannot find module '" + name + "'");
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = (cache[name] = new newRequire.Module(name));

      modules[name][0].call(
        module.exports,
        localRequire,
        module,
        module.exports,
        this
      );
    }

    return cache[name].exports;

    function localRequire(x) {
      var res = localRequire.resolve(x);
      return res === false ? {} : newRequire(res);
    }

    function resolve(x) {
      var id = modules[name][1][x];
      return id != null ? id : x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.register = function (id, exports) {
    modules[id] = [
      function (require, module) {
        module.exports = exports;
      },
      {},
    ];
  };

  Object.defineProperty(newRequire, 'root', {
    get: function () {
      return globalObject[parcelRequireName];
    },
  });

  globalObject[parcelRequireName] = newRequire;

  for (var i = 0; i < entry.length; i++) {
    newRequire(entry[i]);
  }

  if (mainEntry) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(mainEntry);

    // CommonJS
    if (typeof exports === 'object' && typeof module !== 'undefined') {
      module.exports = mainExports;

      // RequireJS
    } else if (typeof define === 'function' && define.amd) {
      define(function () {
        return mainExports;
      });

      // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }
})({"gOYcE":[function(require,module,exports) {
// require('regenerator-runtime/runtime');
var _leaflet = require("./leaflet");
var _login = require("./login");
var _updateSettings = require("./updateSettings");
var _signUp = require("./signUp");
var _stripe = require("./stripe");
//DOM Element
const leafletMap = document.getElementById("map");
const logInForm = document.querySelector(".form--login");
const logOutBtn = document.querySelector(".nav__el--logout");
const updateDataForm = document.querySelector(".form-user-data");
const updatePasswordForm = document.querySelector(".form-user-settings");
const signUpForm = document.querySelector(".form--signUp");
const bookBtn = document.getElementById("book-tour");
///////////////////////////////////////////////////////////////////
//Map
if (leafletMap) {
    const locations = JSON.parse(leafletMap.dataset.locations);
    (0, _leaflet.displayMap)(locations);
}
//Sign up
if (signUpForm) signUpForm.addEventListener("submit", async (e)=>{
    e.preventDefault();
    document.querySelector(".btn--sign-up").textContent = "Please waiting...";
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const passwordConfirm = document.getElementById("password-confirm").value;
    await (0, _signUp.signup)(name, email, password, passwordConfirm);
    document.querySelector(".btn--sign-up").textContent = "Sign Up";
});
//Log in
if (logInForm) logInForm.addEventListener("submit", (e)=>{
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    (0, _login.login)(email, password);
});
//Log out
if (logOutBtn) logOutBtn.addEventListener("click", (0, _login.logout));
//讓登入的使用者能改自己的資料（名字、email、照片）
if (updateDataForm) updateDataForm.addEventListener("submit", async (e)=>{
    e.preventDefault();
    document.querySelector(".btn--save-settings").textContent = "UPDATING...";
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const photo = document.getElementById("photo").files[0];
    await (0, _updateSettings.updateSettings)({
        name,
        email,
        photo
    }, "data");
    document.querySelector(".btn--save-settings").textContent = "SAVE SETTINGS";
    window.setTimeout(location.reload(true), 6000);
});
//讓登入的使用者能改自己的資料（密碼）
if (updatePasswordForm) updatePasswordForm.addEventListener("submit", async (e)=>{
    // // guard to check if different form submitted
    // if (!e.target.classList.contains('form-user-settings')) {
    //   return;
    // }
    e.preventDefault();
    document.querySelector(".btn-save-password").textContent = "Updating...";
    const oldPassword = document.getElementById("password-current").value;
    const newPassword = document.getElementById("password").value;
    const newPasswordConfirm = document.getElementById("password-confirm").value;
    await (0, _updateSettings.updateSettings)({
        oldPassword,
        newPassword,
        newPasswordConfirm
    }, "password");
    document.querySelector(".btn-save-password").textContent = "Save password";
    document.getElementById("password-current").value = "";
    document.getElementById("password").value = "";
    document.getElementById("password-confirm").value = "";
});
if (bookBtn) bookBtn.addEventListener("click", (e)=>{
    e.target.textContent = "Processing...";
    const { tourId  } = e.target.dataset;
    (0, _stripe.bookTour)(tourId);
});

},{"./leaflet":"k5EC4","./login":"iecTM","./updateSettings":"6S4h7","./signUp":"197Om","./stripe":"88km4"}],"k5EC4":[function(require,module,exports) {
var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "displayMap", ()=>displayMap);
const displayMap = (locations)=>{
    const map = L.map("map", {
        zoomControl: false
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    const points = [];
    locations.forEach((loc)=>{
        points.push([
            loc.coordinates[1],
            loc.coordinates[0]
        ]);
        //Set marker and pop-up
        L.marker([
            loc.coordinates[1],
            loc.coordinates[0]
        ]).addTo(map).bindPopup(`<p>Day ${loc.day}: ${loc.description}</p>`, {
            autoClose: false
        }).openPopup();
    });
    //Set bounds
    const bounds = L.latLngBounds(points).pad(0.5);
    map.fitBounds(bounds);
    //阻止滾輪縮放地圖
    map.scrollWheelZoom.disable();
};

},{"@parcel/transformer-js/src/esmodule-helpers.js":"fQ38W"}],"fQ38W":[function(require,module,exports) {
exports.interopDefault = function(a) {
    return a && a.__esModule ? a : {
        default: a
    };
};
exports.defineInteropFlag = function(a) {
    Object.defineProperty(a, "__esModule", {
        value: true
    });
};
exports.exportAll = function(source, dest) {
    Object.keys(source).forEach(function(key) {
        if (key === "default" || key === "__esModule" || dest.hasOwnProperty(key)) return;
        Object.defineProperty(dest, key, {
            enumerable: true,
            get: function() {
                return source[key];
            }
        });
    });
    return dest;
};
exports.export = function(dest, destName, get) {
    Object.defineProperty(dest, destName, {
        enumerable: true,
        get: get
    });
};

},{}],"iecTM":[function(require,module,exports) {
var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "login", ()=>login);
parcelHelpers.export(exports, "logout", ()=>logout);
/* eslint-disable */ // import axios from 'axios';
// const axios = require('axios');
//use fetch instead of axios
var _alert = require("./alert");
const login = async (email, password)=>{
    const req = await fetch("http://127.0.0.1:3000/api/v1/users/login", {
        method: "POST",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            email,
            password
        })
    });
    const res = await req.json();
    if (res.status === "success") {
        (0, _alert.showAlert)("success", "Logged in successfully!");
        window.setTimeout(()=>{
            location.assign("/");
        }, 1500);
    } else (0, _alert.showAlert)("error", res.message);
};
const logout = async ()=>{
    const req = await fetch("http://127.0.0.1:3000/api/v1/users/logout", {
        method: "GET"
    });
    const res = await req.json();
    if (res.status === "success") // location.reload(true);
    window.setTimeout(()=>{
        location.assign("/");
    }, 500);
    else (0, _alert.showAlert)("error", "Error logging out! Try again!");
};

},{"@parcel/transformer-js/src/esmodule-helpers.js":"fQ38W","./alert":"3JxV7"}],"3JxV7":[function(require,module,exports) {
var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "hideAlert", ()=>hideAlert);
parcelHelpers.export(exports, "showAlert", ()=>showAlert);
const hideAlert = ()=>{
    const el = document.querySelector(".alert");
    if (el) el.parentElement.removeChild(el);
};
const showAlert = (type, msg)=>{
    hideAlert();
    const markup = `<div class="alert alert--${type}">${msg}</div>`;
    document.querySelector("body").insertAdjacentHTML("afterbegin", markup);
    window.setTimeout(hideAlert, 3000);
};

},{"@parcel/transformer-js/src/esmodule-helpers.js":"fQ38W"}],"6S4h7":[function(require,module,exports) {
var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "updateSettings", ()=>updateSettings);
/* eslint-disable */ var _alert = require("./alert");
const updateSettings = async (data, type)=>{
    const dt = {
        ...data
    };
    const options = {
        method: "PATCH"
    };
    const url = type === "password" ? "updateMyPassword" : "updateMe";
    if (type === "data") {
        //用formdata處理有 multipart data的情況
        const form = new FormData();
        form.append("name", dt.name);
        form.append("email", dt.email);
        form.append("photo", dt.photo);
        options.body = form;
    } else {
        options.headers = {
            "Content-Type": "application/json"
        };
        options.body = JSON.stringify(dt);
    }
    const req = await fetch(`http://127.0.0.1:3000/api/v1/users/${url}`, options);
    const res = await req.json();
    if (res.status === "success") (0, _alert.showAlert)("success", `${type.toUpperCase()} updated successfully!`);
    else (0, _alert.showAlert)("error", res.message);
};

},{"./alert":"3JxV7","@parcel/transformer-js/src/esmodule-helpers.js":"fQ38W"}],"197Om":[function(require,module,exports) {
var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "signup", ()=>signup);
/* eslint-disable */ var _alert = require("./alert");
const signup = async (name, email, password, passwordConfirm)=>{
    const req = await fetch("http://127.0.0.1:3000/api/v1/users/signup", {
        method: "POST",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            name,
            email,
            password,
            passwordConfirm
        })
    });
    const res = await req.json();
    if (res.status === "success") {
        (0, _alert.showAlert)("success", "Sign up successfully!");
        window.setTimeout(()=>{
            location.assign("/");
        }, 1500);
    } else (0, _alert.showAlert)("error", res.message);
};

},{"./alert":"3JxV7","@parcel/transformer-js/src/esmodule-helpers.js":"fQ38W"}],"88km4":[function(require,module,exports) {
var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "bookTour", ()=>bookTour);
/* eslint-disable */ var _alert = require("./alert");
const bookTour = async (tourId)=>{
    const stripe = Stripe("pk_test_51Loo21IIKOWWxX27FP7yCHnxij7qIjGAmHxtMJVCq5ZTucKXO0ZwP4RLsGypzdBYx4a8DIZYGfr84EeXTOI1UDxQ0003l7V6b5");
    //1) Get session from API
    try {
        const session = await fetch(`http://127.0.0.1:3000/api/v1/booking/checkout-session/${tourId}`, {
            method: "GET"
        });
        const resSession = await session.json();
        //2) 送出checkout form + 信用卡付帳(導向生成的付款頁面)
        window.location.replace(resSession.session.url);
    } catch (err) {
        (0, _alert.showAlert)("error", err);
    }
};

},{"./alert":"3JxV7","@parcel/transformer-js/src/esmodule-helpers.js":"fQ38W"}]},["gOYcE"], "gOYcE", "parcelRequire1248")

//# sourceMappingURL=index.js.map
