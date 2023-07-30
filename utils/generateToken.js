import jwt from "jsonwebtoken";

const generateToken = (res, userId) => {
  const token = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "10d",
  });

  return token;
};

export default generateToken;
