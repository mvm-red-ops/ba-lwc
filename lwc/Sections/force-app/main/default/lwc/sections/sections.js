import { LightningElement, wire, track } from 'lwc';
import getSections from '@salesforce/apex/LWCSections.getSections';
import { NavigationMixin, CurrentPageReference } from 'lightning/navigation';
import { fireEvent } from 'c/pubsub';

export default class sections extends NavigationMixin(LightningElement){
  @track sections;
  @track selectedId;
  @wire(CurrentPageReference) pageRef;
  @track recordPageUrl;

  

  @wire(getSections)
  loadSections(result) {
    this.sections = result;
    if (result.data) {
      fireEvent(this.pageRef, 'sectionListUpdate', result.data);
    }
  }

  get hasResults() {
		return (this.sections.data.length > 0);
  }



  handleSectionView(event) {
    const id = event.target.dataset.id;
    window.console.log(id)
    // Generate a URL to a User record page
    this[NavigationMixin.Navigate]({
        type: 'standard__recordPage',
        attributes: {
            recordId: id,
            objectApiName: 'Section__c',
            actionName: 'view',
        },
    })
  }
}
