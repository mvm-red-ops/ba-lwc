import { LightningElement, track } from 'lwc';

export default class BaUploadParentWrapper extends LightningElement {
  dealProgramSelected
  dealProgram
  fileUploaded
  csvDownloadReady
  documentId
  toggleSpinner
  count
  matchedCount
  unmatchedCount
  

  //handles selection of deal program from dropdown
  handleDealProgramSelection(event){
    this.dealProgram = event.detail
    this.dealProgramSelected = true
  }

  //captures documentId from file uploaded to SF, needed to pass to readCSV Apex class to query the file in Apex
  handleFileUpload(event){
    const fileObj = event.detail.detail.files[0]

    this.documentId = fileObj.documentId
    window.console.log(`documentId: ${fileObj.documentId}`)
  }

  //used to set the values in the legend
  countHandler(event){
    this.count = event.detail.total
    this.matchedCount = event.detail.matched
    this.unmatchedCount = event.detail.totalunmatched
  }

  //handle events to change spinner state
  spinnerHandler(event){
    if(event.detail === 'show') this.toggleSpinner = true
    if(event.detail === 'hide') this.toggleSpinner = false
  }

    //completely resets state to initial values, used mainly for reselecting deal program
    resetState(event){
      this.dealProgramSelected = null
      this.dealProgram = null
      this.documentId = null
      this.toggleSpinner = false
      this.fileUploaded = null
      this.csvDownloadReady = null
      this.count = null
      this.matchedCount = null
      this.unmatchedCount = null
     }
}


