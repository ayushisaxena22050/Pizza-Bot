var displaycard =  {


    insertdata: (size, addons, topping,token) => {
        return new Promise((resolve,reject) => {
            var cardschema= {
                "type": "AdaptiveCard",
                "body": [
                    {
                        "type": "TextBlock",
                        "size": "Medium",
                        "weight": "Bolder",
                        "text": "Please find your order Details:"
                    },
                    {
                        "type": "FactSet",
                        "facts": [
                            {
                                "title": "Size",
                                "value": "Value 1"
                            },
                            {
                                "title": "Addons",
                                "value": "Value 2"
                            },
                            {
                                "title": "Topping",
                                "value": ""
                            },
                            {
                                "title": "Token No:",
                                "value": ""
                            }
                        ]
                    }
                ],
                "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
                "version": "1.0"
            }
            cardschema.body[1].facts[0].value = `${size}`;
            cardschema.body[1].facts[1].value = `${addons}`;
            cardschema.body[1].facts[2].value = `${topping}`;
            cardschema.body[1].facts[3].value = `${token}`;
            resolve(cardschema);
        });
    }
}


module.exports = displaycard;