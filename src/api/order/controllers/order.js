"use strict";

const stripe = require("stripe")(
  "sk_test_51MlOAiEc6pjAeJ95oS28A6CbA4e71iXpWachHwHz7vltUFkCXHXAgcT07gAi7ew1eMjecbeltuwZTFjCtFxawzEC00fjXZbE2I"
);

function calcDiscountPrice(price, discount) {
  if (!discount) return price;

  const discountAmount = (price * discount) / 100;
  const result = price - discountAmount;

  return result.toFixed(2);
}

/**
 * order controller
 */

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController("api::order.order", ({ strapi }) => ({
  async paymentOrder(ctx) {
    const { token, products, idUser, addressShipping } = ctx.request.body;

    console.log("addressShipping: ", addressShipping);
    console.log("products: ", products);

    let totalPayment = 0;
    products.forEach((product) => {
      const priceTemp = calcDiscountPrice(
        product.attributes.price,
        product.attributes.discount
      );

      totalPayment += Number(priceTemp) * product.quantity;
    });

    console.log("star charge");

    const charge = await stripe.charges.create({
      amount: Math.round(totalPayment * 100),
      currency: "eur",
      source: token.id,
      description: `User ID: ${idUser}`,
    });

    const data = {
      products,
      user: idUser,
      totalPayment,
      idPayment: charge.id,
      addressShipping,
    };

    const model = strapi.contentTypes["api::order.order"];
    const validData = await strapi.entityValidator.validateEntityCreation(
      model,
      data
    );

    const entry = await strapi.db
      .query("api::order.order")
      .create({ data: validData });

    return entry;
  },
}));
