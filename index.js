// Initiallising node modules
let express = require("express");
let bodyParser = require("body-parser");
let app = express();
let queryMethods = require("./queryMethods");
let orderManagement = require("./orderManagement");
let OTPManagement = require("./OTPmanagement");
let checkoutCalculation = require("./checkoutCalculation");
let SMSManagement = require("./SMSManagement");
const http = require("http");
const { Redshift } = require("aws-sdk");

// Body Parser Middleware
// app.use(bodyParser.json());

// CORS Middleware
app.use(function (req, res, next) {
  //Enabling CORS
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, contentType,Content-Type, Accept, Authorization"
  );
  next();
});

// Setting up server
var server = app.listen(process.env.PORT || 8080, function () {
  var port = server.address().port;
  console.log("App now running on port", port);
});

// Welcome message default API
app.get("/", function (req, res) {
  res.send("Welcome to Xaprika API Production Environment version 1.4"); // todo it should return a proper html page with links to the actual site
});

// check if phone_no exist
app.get("/api/isPhoneNoExist/:phoneNo", function (req, res) {
  var query = `select phone_no from user_info where phone_no = '${req.params.phoneNo}'`;
  queryMethods.queryPromise(query).then((result) => {
    res.send(result);
  });
});

// check user credentials
app.get("/api/checkCredentials/:phoneNo/:password", function (req, res) {
  var query = `select phone_no from user_info where phone_no = '${
    req.params.phoneNo
  }' and password = '${decodeURIComponent(req.params.password)}'`;
  queryMethods.queryPromise(query).then((result) => {
    res.send(result);
  });
});

// get user information
app.get("/api/getUserInformation/:phoneNo", function (req, res) {
  var query = `select phone_no,name,email_id from user_info where phone_no = '${req.params.phoneNo}'`;
  queryMethods.queryPromise(query).then((result) => {
    res.send(result);
  });
});

// update user information
app.get(
  "/api/updateUserInformation/:phoneNo/:mailId/:name/:password",
  function (req, res) {
    if (decodeURIComponent(req.params.password) === "examplePassword")
      var query = `update user_info set name='${req.params.name}' where phone_no='${req.params.phoneNo}'`;
    else
      var query = `update user_info set name='${
        req.params.name
      }',password='${decodeURIComponent(
        req.params.password
      )}' where phone_no='${req.params.phoneNo}'`;
    queryMethods.queryPromise(query).then((result) => {
      if (!result) {
        res.send({ code: 1, message: "Updation Successfull" });
      } else {
        res.send({ code: 0, message: "some error at database happened" });
      }
    });
  }
);

// insert a new user
app.get(
  "/api/insertNewUserData/:phoneNo/:emailId/:name/:password",
  function (req, res) {
    var query = `select phone_no, email_id from user_info where phone_no = '${req.params.phoneNo}' or email_id = '${req.params.emailId}'`;
    queryMethods.queryPromise(query).then((result) => {
      if (!result.length) {
        var query = `insert into user_info values('${
          req.params.phoneNo
        }','${decodeURIComponent(req.params.name)}','${
          req.params.emailId
        }','${decodeURIComponent(req.params.password)}')`;
        queryMethods.queryPromise(query).then((result2) => {
          // *successfull insertion creates blank object
          if (!result2) {
            res.send({ code: 1, message: "insertion successfull" });
          } else {
            res.send({ code: 0, message: "some error at database happened" });
          }
        });
      } else {
        if (result[0].phone_no === req.params.phoneNo) {
          res.send({ code: 0, message: "phone no already exist" });
        } else {
          if (result[0].email_id === req.params.emailId) {
            res.send({ code: 0, message: "email id already exist" });
          }
        }
      }
    });
  }
);

// get delivery address of an user
app.get("/api/getDefaultAddress/:phoneNo", function (req, res) {
  var query = `select * from user_address where phone_no = '${req.params.phoneNo}' and isDefault = '1'`;
  queryMethods.queryPromise(query).then((result) => {
    res.send(result);
  });
});

// get all the addresses of an user
app.get("/api/getAllAddressofAnUser/:phoneNo", function (req, res) {
  var query = `select * from user_address where phone_no = '${req.params.phoneNo}'`;
  queryMethods.queryPromise(query).then((result) => {
    res.send(result);
  });
});

// add address
app.get(
  "/api/insertNewAddress/:phoneNo/:address/:area/:landmark/:city/:pincode/:state/:tagname",
  function (req, res) {
    let query = `select tag_name from user_address where phone_no = '${
      req.params.phoneNo
    }' and tag_name = '${decodeURIComponent(req.params.tagname)}'`;
    queryMethods.queryPromise(query).then((result) => {
      if (!result.length) {
        let query2 = `update user_address set isDefault = '0' where phone_no='${req.params.phoneNo}'`;
        queryMethods.queryPromise(query2).then((result) => {
          // todo check if updation is successfull or not
          let query3 = `insert into user_address values('${
            req.params.phoneNo
          }','${decodeURIComponent(req.params.address)}','${decodeURIComponent(
            req.params.area
          )}','${req.params.city}','${req.params.pincode}','${
            req.params.state
          }','${decodeURIComponent(req.params.landmark)}','${decodeURIComponent(
            req.params.landmark
          )}','1')`;
          queryMethods.queryPromise(query3).then((result) => {
            if (!result) {
              res.send({ code: 1, message: "insertion successfull" });
            } else {
              res.send({ code: 0, message: "some error at database happened" });
            }
          });
        });
      } else {
        res.send({ code: 0, message: "tag name already exist" });
      }
    });
  }
);

// update address
app.get(
  "/api/updateAddress/:phoneNo/:currentTagName/:address/:area/:city/:pincode/:state/:landmark/:tagname",
  function (req, res) {
    // let query = `select tag_name from user_address where phone_no = '${
    //   req.params.phoneNo
    // }' and tag_name = '${decodeURIComponent(req.params.tagname)}'`;
    //queryMethods.queryPromise(query).then((result) => {
    // if (!result.length) {
    let query2 = `update user_address set address_line_1='${decodeURIComponent(
      req.params.address
    )}',area='${decodeURIComponent(req.params.area)}',city='${
      req.params.city
    }',pin_code='${req.params.pincode}',state='${
      req.params.state
    }',landmark='${decodeURIComponent(
      req.params.landmark
    )}',tag_name='${decodeURIComponent(req.params.tagname)}' where phone_no='${
      req.params.phoneNo
    }' and tag_name='${decodeURIComponent(req.params.currentTagName)}'`;
    queryMethods.queryPromise(query2).then((result) => {
      if (!result) {
        res.send({ code: 1, message: "insertion successfull" });
      } else {
        res.send({ code: 0, message: "some error at database happened" });
      }
    });
    // }
    //  else {
    //   res.send({ code: 0, message: "tag name already exist" });
    // }
    //});
  }
);

// delete address
app.get("/api/deleteAddress/:phoneNo/:tagname", function (req, res) {
  let query = `delete from user_address where phone_no = '${
    req.params.phoneNo
  }' and tag_name = '${decodeURIComponent(req.params.tagname)}'`;
  queryMethods.queryPromise(query).then((result) => {
    if (!result) {
      let query2 = `select tag_name,isDefault from user_address where phone_no='${req.params.phoneNo}'`;
      queryMethods.queryPromise(query2).then((result) => {
        if (result.length) {
          if (result.filter((data) => data.isDefault === 1).length < 1) {
            let query3 = `update user_address set isDefault='1' where phone_no='${req.params.phoneNo}' and tag_name='${result[0].tag_name}'`;
            queryMethods.queryPromise(query3).then((result) => {
              if (!result) {
                res.send({ code: 1, message: "deletion successfull" });
              }
            });
          } else {
            res.send({ code: 1, message: "deletion successfull" });
          }
        } else {
          res.send({ code: 1, message: "deletion successfull" });
        }
      });
    } else {
      res.send({ code: 0, message: "tag name already exist" });
    }
  });
});

// make address default
app.get("/api/makeAddressDefault/:phoneNo/:tagname", function (req, res) {
  let query = `update user_address set isDefault='0' where phone_no = '${req.params.phoneNo}'`;
  queryMethods.queryPromise(query).then((result) => {
    if (!result) {
      let query2 = `update user_address set isDefault='1' where phone_no = '${
        req.params.phoneNo
      }' and tag_name='${decodeURIComponent(req.params.tagname)}'`;
      queryMethods.queryPromise(query2).then((result) => {
        if (!result) {
          res.send({ code: 1, message: "updation successfull" });
        } else {
          res.send({ code: 0, message: "something went wrong" });
        }
      });
    } else {
      res.send({ code: 0, message: "something went wrong" });
    }
  });
});

// get all the orders placed by an user
app.get("/api/getAllOrdersofAnUser/:phoneNo", function (req, res) {
  var query = `select * from order_info where phone_no = '${req.params.phoneNo}'`;
  queryMethods.queryPromise(query).then((result) => {
    res.send(result);
  });
});

//get active banner images
app.get("/api/getActiveBanners", function (req, res) {
  var query = `select * from banner_info where is_banner_active = '1'`;
  queryMethods.queryPromise(query).then((result) => {
    res.send(result);
  });
});

//get all the primary category
app.get("/api/getAllPrimaryCategoryData", function (req, res) {
  var query = `select * from primary_category`;
  queryMethods.queryPromise(query).then((result) => {
    res.send(result);
  });
});

//get all the products
app.get("/api/getAllTheProduct", function (req, res) {
  var query = `select product_id,product_name,product_quantity,product_quantity_unit from product_info`;
  queryMethods.queryPromise(query).then((result) => {
    res.send(result);
  });
});

//get all the products under a primary category
app.get(
  "/api/getAllProductUnderPrimaryCategory/:primary_category_link",
  function (req, res) {
    var query = `select * from product_info where category_link in ('${req.params.primary_category_link}')`;
    queryMethods.queryPromise(query).then((result) => {
      res.send(result);
    });
  }
);

//get all the products under a secondary category
app.get(
  "/api/getAllProductUnderSecondaryCategory/:secondary_category_link",
  function (req, res) {
    var query = `select * from product_info where sec_category_link in ('${req.params.secondary_category_link}')`;
    queryMethods.queryPromise(query).then((result) => {
      res.send(result);
    });
  }
);

// get info about products byt a group of product id
app.get(
  "/api/getProductsByaGroupOfIds/:array_of_products_id",
  function (req, res) {
    var query = `select * from product_info where product_id in (${req.params.array_of_products_id})`;
    queryMethods.queryPromise(query).then((result) => {
      res.send(result);
    });
  }
);

// get all secondary category data under a primary category
app.get(
  "/api/getAllSecondaryCategoryData/:primary_category_link",
  function (req, res) {
    var query = `select * from secondary_category where category_link='${req.params.primary_category_link}'`;
    queryMethods.queryPromise(query).then((result) => {
      res.send(result);
    });
  }
);

// send otp
app.get("/api/sendOTP/:phone_no", function (req, res) {
  OTPManagement.fetchOTPPromise(req.params.phone_no).then((result) => {
    SMSManagement.sendMessagePromise(
      req.params.phone_no,
      `${result} is your secret OTP to be used at xaprika.com. Please do not share your OTP with anyone.`
    ).then((result) => {
      if (result === "Message Sent")
        res.send([
          {
            code: 1,
            message: "Message Sent",
          },
        ]);
    });
  });
});

// check otp
app.get("/api/checkOTP/:phone_no/:OTP", function (req, res) {
  OTPManagement.checkOTPPromise(req.params.phone_no, req.params.OTP).then(
    (result) => {
      if (result === "Matching")
        res.send([
          {
            code: 1,
            message: "Matching",
          },
        ]);
      else
        res.send([
          {
            code: 0,
            message: "Not Matching",
          },
        ]);
    }
  );
});

// total price calculation
app.get(
  "/api/finalPriceCalculation/:productIdArray/:couponCode",
  function (req, res) {
    checkoutCalculation
      .finalCalculationPromise(req.params.productIdArray, req.params.couponCode)
      .then((result) => {
        res.send(result);
      });
  }
);

// validate coupon code
app.get(
  "/api/getCouponDetails/:couponCode/:totalProductValue/:cartProductIdsArray",
  function (req, res) {
    var query = `select * from coupon_details where code='${req.params.couponCode.toUpperCase()}'`;
    queryMethods.queryPromise(query).then((result) => {
      if (result.length) {
        let today = new Date();
        if (
          parseInt(result[0].start_date.substring(0, 2)) <= today.getDate() &&
          parseInt(result[0].start_date.substring(3, 5)) <=
            today.getMonth() + 1 &&
          parseInt(result[0].start_date.substring(6, 10)) <= today.getFullYear()
        ) {
          if (
            parseInt(result[0].end_date.substring(0, 2)) >= today.getDate() &&
            parseInt(result[0].end_date.substring(3, 5)) >=
              today.getMonth() + 1 &&
            parseInt(result[0].end_date.substring(6, 10)) >= today.getFullYear()
          ) {
            if (result[0].min_order_value <= req.params.totalProductValue) {
              if (result[0].coupon_type_code === 3) {
                let query1 = `select * from coupon_off_product_list where coupon_code='${req.params.couponCode.toUpperCase()}'`;
                queryMethods.queryPromise(query1).then((result1) => {
                  let flag = 0;
                  let cartDataArray = req.params.cartProductIdsArray.split(",");
                  let offOnCategoriesArray = result1[0].list.split(",");
                  for (let i = 0; i < cartDataArray.length; i++) {
                    let cartDataSubstring =
                      result1[0].list_type === "sec_category_id"
                        ? cartDataArray[i].substring(0, 5)
                        : result1[0].list_type === "primary_category_id"
                        ? cartDataArray[i].substring(0, 3)
                        : cartDataArray[i];
                    let foundData = offOnCategoriesArray.filter(
                      (data) => data === cartDataSubstring // change substring range depending on the type of list type - secondary category id - 0,5 - primary category id - 0,3 - full product id - no substring
                    );
                    if (foundData.length) {
                      flag = 1;
                      break;
                    }
                  }
                  if (flag === 0) {
                    res.send([
                      {
                        code: 0,
                        message:
                          "You haven't added anything from the applicable categories",
                      },
                    ]);
                  } else {
                    res.send([
                      {
                        code: 1,
                        message: "Coupon is valid",
                        couponDescription: result[0].coupon_description,
                      },
                    ]);
                  }
                });
              } else {
                res.send([
                  {
                    code: 1,
                    message: "Coupon is valid",
                    couponDescription: result[0].coupon_description,
                  },
                ]);
              }
            } else {
              res.send([
                {
                  code: 0,
                  message: `The minimum product value should be atleast Rs. ${result[0].min_order_value}`,
                },
              ]);
            }
          } else {
            res.send([
              {
                code: 0,
                message: "Oh no! The coupon has expired",
              },
            ]);
          }
        } else {
          res.send([
            {
              code: 0,
              message: "Guess you need to wait for a few more days!",
            },
          ]);
        }
      } else {
        res.send([
          {
            code: 0,
            message: "No such coupon found",
          },
        ]);
      }
    });
  }
);

// get expected delivery date
app.get("/api/getExpectedDeliveryDate", function (req, res) {
  var query = "select * from expected_delivery_date";
  queryMethods.queryPromise(query).then((result) => {
    let today = new Date();
    let newDate = new Date();
    newDate.setDate(today.getDate() + result[0].dayCount);
    let expectedDeliveryDate =
      newDate.getDate() +
      "/" +
      (newDate.getMonth() + 1) +
      "/" +
      newDate.getFullYear();
    res.send([
      {
        expectedDeliveryDate: expectedDeliveryDate,
        message: result[0].specialMessage,
      },
    ]);
  });
});

// create order
app.get(
  "/api/confirmOrder/:phoneNo/:itemCount/:totalAmount/:discountAmount/:deliveryCharges/:otherCharges/:deliveryAddress/:area/:city/:pinCode/:state/:landmark/:recieversPhoneNo/:cartData/:appliedCouponCode",
  function (req, res) {
    let query = orderManagement.createOrder(
      req.params.phoneNo,
      req.params.itemCount,
      req.params.totalAmount,
      req.params.discountAmount,
      req.params.deliveryCharges,
      req.params.otherCharges,
      decodeURIComponent(req.params.deliveryAddress),
      decodeURIComponent(req.params.area),
      req.params.city,
      req.params.pinCode,
      req.params.state,
      decodeURIComponent(req.params.landmark),
      req.params.recieversPhoneNo,
      "Cash on Delivery",
      req.params.appliedCouponCode
    );
    queryMethods.queryPromise(query.query).then((result) => {
      if (!result) {
        let query2 = `select product_id, product_name, product_sale_price from product_info where product_id in (${req.params.cartData})`;
        queryMethods.queryPromise(query2).then((result) => {
          let query3 = orderManagement.productInfoInsertQuery(
            query.orderId,
            req.params.cartData,
            result
          );
          queryMethods.queryPromise(query3).then((result) => {
            if (!result) {
              SMSManagement.sendMessagePromise(
                req.params.phoneNo,
                `You have successfully placed an order with us. We will deliver your order ASAP. Order Number: ${query.orderId}, Track your Order using the below link: https://xaprika.com/OrderHistory`
              ).then((result) => {
                console.log("sms sent");
              });
              res.send({
                code: 1,
                message: "Order Successfull",
                orderId: query.orderId,
              });
            } else {
              res.send({ code: 0, message: "Order Unsuccessfull", orderId: 0 });
            }
          });
        });
      } else {
        res.send({ code: 0, message: "Order Unsuccessfull", orderId: 0 });
      }
    });
  }
);

//get all the company info under xaprika specials
app.get("/api/getAllCompanyInXapSpecials", function (req, res) {
  var query = `select * from xap_specials_company_info`;
  queryMethods.queryPromise(query).then((result) => {
    res.send(result);
  });
});
