import asyncHandler from "express-async-handler";
import Bill from "../models/billModel.js";
// @desc   Generate Bill
// route   POST /api/bill/generate
// @access Private
const generate = asyncHandler(async (req, res) => {
  const bill = req.body;
  const billDoc = await Bill.create(bill);
  if (billDoc) {
    res.status(200).json({ message: "bill generated Success" });
  } else {
    res
      .status(400)
      .json({ message: "something went wrong please try again!!!" });
  }
});
// @desc   Get All Bill
// route   POST /api/bill/generate
// @access Private
const billsList = asyncHandler(async (req, res) => {
  const billDoc = await Bill.find();
  if (billDoc) {
    res.status(200).json({ message: "bill generated Success", billDoc });
  } else {
    res
      .status(400)
      .json({ message: "something went wrong please try again!!!" });
  }
});
// @desc   Change Bill Status
// route   POST /api/bill/shipped/:id
// @access Private
const changeStatus = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const status = req.body.status;
  let billDoc;
  if (status === "shipped") {
    billDoc = await Bill.findByIdAndUpdate(id, { status: "pending" });
  } else {
    billDoc = await Bill.findByIdAndUpdate(id, { status: "shipped" });
  }
  if (billDoc) {
    res.status(200).json({ message: "Status Change Successfully" });
  } else {
    res
      .status(400)
      .json({ message: "something went wrong please try again!!!" });
  }
});

export { generate, billsList, changeStatus };
