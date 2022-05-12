const PG_FIREBASE_DB = 'https://pghackathon-default-rtdb.asia-southeast1.firebasedatabase.app';

App = {
  web3Provider: null,
  contracts: {},
  user: null,
  listings: [],
  agents: [],

  page: $("#page-content"),
  pageAgreementForm: $("#agreement-form"),

  showLoader: () => {
    App.page.html("Loading...");
  },

  init: async function() {
    // load listings
    App.showLoader();
    const [listings, agents] = await Promise.all([
      $.getJSON('../listings.json'), 
      $.getJSON('../agents.json')
    ]);

    App.listings = listings;
    App.agents = agents;

    await App.initWeb3();
  },

  loadAccount: async () => {
    // Set the current blockchain account
    App.account = web3.eth.accounts[0]
  },


  populateAgreementForm: function(listing) {
    App.pageAgreementForm.find('.listing-card img').attr('src', listing.media?.cover?.V550);
    App.pageAgreementForm.find('#agreement-listing-title').html(listing.localizedTitle);
    App.pageAgreementForm.find('#agreement-rental-amount').val(listing.price.pretty);
    App.pageAgreementForm.find('#agreement-landlord-name').val(listing.property.developer);
    App.pageAgreementForm.find('.btn-agreement').data('id', listing.id);
    /** add later 
    $('#sign-agreement').on('click', () => {
      App.createDoc(listing);
    })
    **/
  },

  loadAllListings: async function() {
    let cards = App.listings.map((i) => {
      return `<div class="col-sm-4">
      <div class="listing-card">
        <img src="${i.media?.cover?.V550}" />
        <h4>${i.localizedTitle}</h4>
        <div class="price">${i.price.pretty}</div>
        <button class="btn btn-primary show-agreement-model" 
        data-listing-id="${i.id}" data-toggle="modal" data-target="#agreement-form">Rent</button>
      </div>
    </div>`;
    });

    let rows = $('<div class="row"></div>');
    rows.append(cards);

    App.page.html(rows);
  },

  loadMyListings: async function() {
    App.showLoader();
    console.log('My listing page: ');
  },

  handleAgreement: async function() {
    try {
      const agreementData = {
        'listing_id': App.pageAgreementForm.find('.btn-agreement').data('id'),
        'user_id': (App.user) ? App.user[0] : null,
        'title': App.pageAgreementForm.find('#agreement-listing-title').html(),
        'tenant': App.pageAgreementForm.find('#tenant').val(),
        'agreement-rental-start-date': App.pageAgreementForm.find('#agreement-rental-start-date').val(),
        'agreement-rental-amount': App.pageAgreementForm.find('#agreement-rental-amount').val(),
        'rental-duration': App.pageAgreementForm.find("select#rental-duration option").filter(":selected").val(),  
      };
      App.savingAgreements(agreementData);
      App.loadAllListings();
    }catch (error) {
      console.log(error);
      console.error("error in saving Agreement");
    }
  },

  savingAgreements: function(data) {
    console.log(data);

    fetch(`${PG_FIREBASE_DB}/agreements.json`, {
      'method': 'POST',
      'body': JSON.stringify(data),
      'headers': {
        'Content-Type': 'application/json',
      }
    });
  },

  getAgreements: function() {
    fetch(`${PG_FIREBASE_DB}/agreements.json`);
  },
    
  showAgreementModel: async function(e) {
    const listingId = parseInt(e.target.dataset.listingId, 10);
    const listing = App.listings.find(i => i.id === listingId);
    // call the method to load the agreement
    App.populateAgreementForm(listing);
  },

  initWeb3: async function() {
    // Modern dapp browsers...
    if (window.ethereum) {
      App.web3Provider = window.ethereum;
      try {
        // Request account access
        App.user = await window.ethereum.request({ method: "eth_requestAccounts" });
        console.log('Logged in user: ' + App.user);
      } catch (error) {
        // User denied account access...
        App.user = null;
        console.error("User denied account access")
      }
    }
    // Legacy dapp browsers...
    else if (window.web3) {
      App.web3Provider = window.web3.currentProvider;
    }
    // If no injected web3 instance is detected, fall back to Ganache
    else {
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
    }
    web3 = new Web3(App.web3Provider);

    await App.loadAccount();
    return App.initContract();

  },

  initContract: async function() {
    const rentAgreement = await $.getJSON('RentAgreement.json');
    App.contracts.RentalAgreement = TruffleContract(rentAgreement);
    App.contracts.RentalAgreement.setProvider(App.web3Provider);
    App.rentAgreement = await App.contracts.RentalAgreement.deployed();
    
    App.loadAllListings();
    return App.bindEvents();
  },

  createDoc: function(listing) {
    var doc = new jsPDF();
    doc.setFontSize(10);
    doc.text(10, 10, `This is the rent agreement for the property ${listing.localizedTitle} decided to be rented out at ${listing.price.pretty}`);
    doc.save(listing.localizedTitle);
  },

  bindEvents: function() {
    $(document).on('click', '.nav-homepage', App.loadAllListings);
    $(document).on('click', '.nav-my-listings', App.loadMyListings);
    $(document).on('click', '.btn-agreement', App.handleAgreement);
    $(document).on('click', '.show-agreement-model', App.showAgreementModel);
    // App.sampleFunc();
  },

  createAgreement: async function(listingId, rent, startDate, duration, tenant, address) {
    await App.rentAgreement.createAgreement(listingId, rent, startDate, duration, tenant, address);
  },

  getAgreement: async function(listingId) {
    await App.rentAgreement.agreements(listingId);
  },

  sampleFunc: async function() {
    console.log(await App.rentAgreement.testFunc({ from: App.account }));
  }
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
