import { LightningElement, api } from 'lwc';

export default class Legend extends LightningElement {
    @api count;
    @api matchedCount;
    @api unmatchedCount;


}