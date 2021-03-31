import { LightningElement, api } from 'lwc';

const actions = [
    { label: 'Compare Schedule Values', name: 'compare_schedule' }
  ];

export default class DataTable extends LightningElement {
    @api schedData
    @api tableScheds
    showModal 
    modalScheds
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
    modalColumns = [
      { label: 'Name', fieldName: 'Name__c', type: 'text'},
      { label: '800 #', fieldName: 'X800_Number__c', type: 'text'},
      { label: 'ISCI Code', fieldName: 'ISCI_CODE__c', type: 'text'},
      { label: 'Rate', fieldName: 'Rate__c', type: 'text'},
      { label: 'Show Title', fieldName: 'LF_traffic__c', type: 'text'}
    ]

    connectedCallback(){
      window.console.log(`data table`)
      window.console.log(`table scheds: ${this.tableScheds}`)
    }
  
      handleScheduleView(event) {
        const scheduleSelection = new CustomEvent("scheduleselected", {
          detail: event.detail.selectedRows
        });
        this.dispatchEvent(scheduleSelection);
      }
  

      handleScheduleComparison(event) {
        let rowId = event.detail.row.Id;
        const modalRows = []
        let valMap = {}  
        let fields 
        const foundSchedule = this.schedData.find( sched => {      
          let schedId = Object.keys(sched)[0]
          if( schedId === rowId ) {
            valMap.id = schedId 
  
           fields = Object.values(sched)[0];
  
            valMap.old = {}
            valMap.new = {}
            
            
            valMap.old.Name__c = 'BA Schedule'    
            valMap.old.Rate__c = fields.rate[0]
            valMap.old.ISCI_CODE__c = fields.isci[0]
            valMap.old.X800_Number__c = fields.phone[0]
            valMap.old.LF_traffic__c = fields.showtitle[0] 
  
            valMap.new.Name__c = 'SF Schedule' 
            valMap.new.Rate__c = fields.rate[1]
            valMap.new.ISCI_CODE__c = fields.isci[1]
            valMap.new.X800_Number__c = fields.phone[1]
            valMap.new.LF_traffic__c = fields.showtitle[1]
            return true
          }
        })
        modalRows.push(valMap.old)
        modalRows.push(valMap.new)
  
  
        this.modalScheds = modalRows
  
        if(!foundSchedule){
          return 
        }
          
        this.viewScheduleComparison(valMap)
    }

      // view the current record details
      viewScheduleComparison(scheduleVals) {
        this.showModal = true;
        this.modalSched = scheduleVals;
      }

      // closing modal box
      closeModal(event) {
          this.showModal = false;
      }
  
  }
  
  
  
    
  
  