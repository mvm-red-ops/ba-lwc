import { LightningElement, api } from 'lwc';

export default class Legend extends LightningElement {
    @api matchedCount;
    @api unmatchedCount;

    connectedCallback(){
        this.count = this.matchedCount + this.unmatchedCount
    }

}