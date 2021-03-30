import { LightningElement, api } from 'lwc';

export default class ComparisonModal extends LightningElement {
    @api modalColumns
    @api modalScheds

    handleModalClose(event){
        const closeModalEvent = new CustomEvent("closemodal", {
            detail: ''
          });
    
          // this.value = event.detail.value;
          this.dispatchEvent(closeModalEvent);
    }
}