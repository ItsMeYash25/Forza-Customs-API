import Service from "../models/serviceModel.js";
import asyncHandler from "express-async-handler";

const addAppointment = asyncHandler(async (req, res) => {
  const { fName, lName, email, contact, addr, vName, vNum, aptDate } = req.body;
  const serviceData = await Service.create({
    firstName: fName,
    lastName: lName,
    email: email,
    contact_number: contact,
    address: addr,
    vehicle_name: vName,
    vehicle_number: vNum,
    appointment_date: aptDate,
  });
  if (serviceData) {
    res.status(200).json(serviceData);
  } else {
    res.status(404).json({ message: "something went wrong" });
  }
});

const viewStatus = asyncHandler(async (req, res) => {
  const { id } = req.body;
  const serviceDoc = await Service.findById(id);
  if (serviceDoc) {
    res.status(200).json(serviceDoc);
  } else {
    res.status(404).json({ message: "Something went wrong" });
  }
});

const viewAppointments = asyncHandler(async (req, res) => {
  const appointments = await Service.find();
  if (appointments) {
    res.status(200).json(appointments);
  } else {
    res.status(400).json({ message: "Something went wrong" });
  }
});
const updateStatusAppointment = asyncHandler(async (req, res) => {
  // console.log(req.body);
  const {id, status, message} = req.body;
  const updatedDoc = await Service.findByIdAndUpdate(id,{status: status, message: message})
  if(updatedDoc){
    res.status(200).json({"message":"Data Updated Successfully"})
  }else{
    res.status(404).json({"message":"Somthing Went wrong!!!"})
  }
});

export { addAppointment, viewStatus, viewAppointments, updateStatusAppointment };
