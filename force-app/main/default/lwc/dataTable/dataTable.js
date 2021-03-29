import { LightningElement, api } from 'lwc';

export default class DataTable extends LightningElement {

     data = [];
     error;
     columns = [
      { label: 'Schedule', fieldName: 'idUrl', type: 'url', typeAttributes: { label: {fieldName: 'Id'}}, cellAttributes: { class: { fieldName: 'workingCSSClassSchedule' }}, target: '_blank'}, 
      { label: 'Week', fieldName: 'Week__c', type: 'text', cellAttributes: { class: { fieldName: 'workingCSSClassWeek' }} },
      { label: 'Show Title', fieldName: 'LF_traffic__c', type: 'text', cellAttributes: { class: { fieldName: 'workingCSSClassShowTitle'}}}, 
      { label: 'Deal Program', fieldName: 'DealProgram__c', type: 'text', cellAttributes: { class: { fieldName: 'workingCSSClassDealProg'}}}, 
      { label: 'Long Form', fieldName: 'Long_Form__c', type: 'text', cellAttributes: { class: { fieldName: 'workingCSSClassLongForm' }}},
      { label: '800 #', fieldName: 'X800_Number__c', type: 'text', cellAttributes: { class: { fieldName: 'workingCSSClassPhone' }}},
      { label: 'ISCI Code', fieldName: 'ISCI_CODE__c', type: 'text', cellAttributes: { class: { fieldName: 'workingCSSClassISCI' }}},
      { label: 'Rate', fieldName: 'Rate__c', type: 'text', cellAttributes: { class: { fieldName: 'workingCSSClassRate'}}},
      {
        type: 'action',
        typeAttributes: {
          rowActions: actions,
            menuAlignment: 'right'
        }
      }
    ];
    @api dealProgram
     count;
     matchedCount;
     unmatchedCount = 0;
     displayFileUpload = true
     toggleSpinner = false
     tableScheds = {matched: [], unmatched: []};
     unmatchedBAScheds = [];
     unmatchedSFScheds = [];
     matchedScheds = [];
     exportMatches = [];
     exportUnmatches = [];
     selectedRows = [];
     updateResult
     myRecordId = Id;
     fileUploadUpdateButton
     showModal 
     modalScheds
     modalColumns = [
      { label: 'Name', fieldName: 'Name__c', type: 'text'},
      { label: '800 #', fieldName: 'X800_Number__c', type: 'text'},
      { label: 'ISCI Code', fieldName: 'ISCI_CODE__c', type: 'text'},
      { label: 'Rate', fieldName: 'Rate__c', type: 'text'},
      { label: 'Show Title', fieldName: 'LF_traffic__c', type: 'text'}
    ]

    displayFileUpload = true;
    displayDatatable = false;


    get renderUpdateButton() {
        return this.matchedScheds.length > 0 && !this.updateResult
    }

    set renderUpdateButton(event){
        return false
    }

    get renderUpdateComponent(){
        return this.matchedScheds.length > 0 
    }


    get noMatches(){
        return this.matchedScheds.length === 0 && this.unmatchedBAScheds.length > 0 && this.unmatchedSFScheds.length
    }


}