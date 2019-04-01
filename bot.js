const { ActivityTypes, ActionTypes, CardFactory, MessageFactory } = require('botbuilder');
const { ChoicePrompt, DialogSet, NumberPrompt, TextPrompt, WaterfallDialog } = require('botbuilder-dialogs');


const CONVERSATION_DATA_PROPERTY = 'conversationData';
const USER_PROFILE_PROPERTY = 'userProfile';
const DIALOG_STATE_PROPERTY = 'dialogState';
const buttons = [
    { type: ActionTypes.ImBack, title: 'Place Order', displayText: 'Place Order' },
    { type: ActionTypes.ImBack, title: 'Order Status', displayText: 'Order Status' }
];
const PLACE_ORDER = 'place_order';
const STATUS = 'status';
const Size = require('./resources/Size.json');
const Toppings = require('./resources/Toppings.json');
const Addons = require('./resources/Addons.json');
const TOKEN_PROMPT = 'token_prompt';
const displayFile = require('./resources/display.js');
const Data = require('./resources/data.js')
class PizzaBot {
    constructor(conversationState, userState) {
        // Create a new state accessor property. See https://aka.ms/about-bot-state-accessors to learn more about bot state and state accessors.
        this.conversationState = conversationState;
        this.userState = userState;

        this.dialogState = this.conversationState.createProperty(DIALOG_STATE_PROPERTY);

        this.userProfile = this.userState.createProperty(USER_PROFILE_PROPERTY);

        this.dialogs = new DialogSet(this.dialogState);
        this.dialogs.add(new NumberPrompt(TOKEN_PROMPT));

        this.dialogs.add(new WaterfallDialog(PLACE_ORDER, [
            this.size.bind(this),
            this.toppings.bind(this),
            this.addons.bind(this),
            this.display.bind(this)
        ]));

        // Create a dialog that displays a user name after it has been collected.
        this.dialogs.add(new WaterfallDialog(STATUS, [
            this.displayStatus.bind(this),
            this.tokenno.bind(this)
        ]));
    }
    async size(step) {
        //const user = await this.userProfile.get(step.context, {});
       return await step.context.sendActivity({ attachments: [CardFactory.adaptiveCard(Size)] });

    }
    async toppings(step) {
    
      const user = await this.userProfile.get(step.context, {});
      var size = Object.values(step.context._activity.value);
        user.size = size;
        await this.userProfile.set(step.context, user);
       return await step.context.sendActivity({ attachments: [CardFactory.adaptiveCard(Toppings)] })
       
    }
    async addons(step) {
        const user = await this.userProfile.get(step.context, {});
        //console.log(step.context._activity.value)
        var client = step.context._activity.value;
        var toppings =[];
        for(var i in client){
            if (client[i]=='true'){
                toppings.push(i);
            }
            
            }
            user.toppings = toppings;
        await step.context.sendActivity({ attachments: [CardFactory.adaptiveCard(Addons)] })
        
    }
    async display(step) {
    const user = await this.userProfile.get(step.context, {});
       // console.log(step.context._activity.value)
        var client = step.context._activity.value;
        var addons =[];
        for(var i in client){
            if (client[i]=='true'){
                addons.push(i);
            }
            
            }
            user.addons = addons
            var val = Math.floor(1000 + Math.random() * 9000);
            user.value = val
            if(!Data[val]) {
                Data[val] = {
                    size : `${user.size}`,
                    topping: `${user.toppings}`,
                    addons: `${user.addons}`,
                    status: 'under process'
                }
            //console.log("dynamic => ", Data);
                
            }
            //cons  ole.log(Data.val)
            let card = await displayFile.insertdata(user.size, user.addons, user.toppings,user.value);
            
            //  user.dict[val]='underprocess';
            //     // If key is not initialized or some bad structure
            //    user.dict.push({'user':'underprocess'});
  
                //console.log(user.dict)
            
            //console.log(user.size,user.toppings,user.addons);
        await step.context.sendActivity({ attachments: [CardFactory.adaptiveCard(card)] })
       
        
    }
    async displayStatus(step) {
        return await step.prompt(TOKEN_PROMPT, `What is your Token No?`);
    }
    async tokenno(step){
        const user = await this.userProfile.get(step.context, {});
        if(step.result){
        for(var key in Data){
            if (key == step.result){
                return await step.context.sendActivity(`${Data[key].status}`);
            }
                }
        }
        else{
                return await step.context.sendActivity(`Please check Token No.`);   
            }
        
       
    }
    async onTurn(turnContext) {
        // const dc = await this.dialogs.createContext(turnContext);
        // const user = await this.userProfile.get(dc.context, {});
        // See https://aka.ms/about-bot-activity-message to learn more about the message and other activity types.
        // console.log(turnContext.activity.text);
        if (turnContext.activity.type === ActivityTypes.Message) {
            // Create a dialog context object.
            const dc = await this.dialogs.createContext(turnContext);
            const utterance = (turnContext.activity.text || '').trim().toLowerCase();
            if (utterance === 'cancel') {
                if (dc.activeDialog) {
                    await dc.cancelAllDialogs();
                    await dc.context.sendActivity(`Ok... canceled.`);
                } else {
                    await dc.context.sendActivity(`Nothing to cancel.`);
                }
            }

            // If the bot has not yet responded, continue processing the current dialog.
            await dc.continueDialog();

            // Start the sample dialog in response to any other input.
            if (!turnContext.responded) {
                const user = await this.userProfile.get(dc.context, {});
                if (turnContext.activity.text=='Status') {
                    await dc.beginDialog(STATUS);
                } else {
                    await dc.beginDialog(PLACE_ORDER);
                }
            }
        }
        else if (turnContext.activity.type === ActivityTypes.ConversationUpdate) {
            if (turnContext.activity.membersAdded.length !== 0) {
                // Iterate over all new members added to the conversation
                for (var idx in turnContext.activity.membersAdded) {
                    // Greet anyone that was not the target (recipient) of this message.
                    // Since the bot is the recipient for events from the channel,
                    // context.activity.membersAdded === context.activity.recipient.Id indicates the
                    // bot was added to the conversation, and the opposite indicates this is a user.
                    if (turnContext.activity.membersAdded[idx].id !== turnContext.activity.recipient.id) {
                        // Send a "this is what the bot does" message.
                        await this.sendSuggestedActions(turnContext);
                    }
                }
            }
        }
        // Save changes to the user state.
        await this.userState.saveChanges(turnContext);

        // End this turn by saving changes to the conversation state.
        await this.conversationState.saveChanges(turnContext);
    }
    /**
     * Send suggested actions to the user.
     * @param {TurnContext} turnContext A TurnContext instance containing all the data needed for processing this conversation turn.
     */
    async sendSuggestedActions(turnContext) {

        await turnContext.sendActivity({
            attachments: [CardFactory.heroCard(
                'Pizza Factory',
                (['https://cdn-ap-ec.yottaa.net/55b635db0b5344273c002031/d1fd69005c1501336a81123dfe2baf36.yottaa.net/v~4b.48f/20-3-large.jpg?yocs=2u_&yoloc=ap']),
                CardFactory.actions([
                    {
                        type: 'imBack',
                        title: 'Place Order',
                        value: "Place Order"

                    },
                    {
                        type: "imBack",
                        title: 'Status',
                        value: "Status"

                    }
                ])
            )]
        });
    }


}
module.exports.PizzaBot = PizzaBot;


