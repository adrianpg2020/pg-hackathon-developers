const PG_FIREBASE_DB = 'https://pghackathon-default-rtdb.asia-southeast1.firebasedatabase.app';

App = {
  web3Provider: null,
  contracts: {},
  account: null,
  listings: [],
  agents: {},
  agreements: [],
  draftAgreements: [],

  page: $("#page-content"),
  pageAgreementForm: $("#agreement-form"),
  pageAcceptance: $("#rental-acceptance"),

  showLoader: () => {
    App.page.html("Loading...");
  },

  isAgent: () => {
    return Object.values(App.agents).includes(App.account)
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
    App.pageAgreementForm.find('#agreement-rental-amount').val(listing.price.value);
    App.pageAgreementForm.find('#agreement-landlord-name').val(listing.property.developer);
    App.pageAgreementForm.find('.btn-agreement').data('id', listing.id);
    /** add later 
    $('#sign-agreement').on('click', () => {
      App.createDoc(listing);
    })
    **/
  },

  loadAllListings: async function() {
    await App.getAgreements();
    await App.getDraftAgreements();

    App.draftAgreements.forEach((item) => {
      const listing = App.listings.find((listing) => listing.id === item.listing_id);
      if(listing) {
        listing.draft = true;
      }
    });

    const isAgent = App.isAgent();

    let cards = App.listings.map((i) => {
      let disabled = null;
      if(i.draft === true || i.rented === true) {
        disabled = "disabled";
      }
      let button =  !isAgent ? `<button class="btn btn-primary show-agreement-model" 
      data-listing-id="${i.id}" data-toggle="modal" ${disabled}   
      data-target="#agreement-form">${i.rented ? 'Sold out' : 'Rent'}</button>` : '';

      return `<div class="col-sm-4">
      <div class="listing-card">
        <img src="${i.media?.cover?.V550}" />
        <h4>${i.localizedTitle}</h4>
        <div class="price">${i.price.pretty}</div>
        ${button}
      </div>
    </div>`;
    });

    let rows = $('<div class="row"></div>');
    rows.append(cards);

    App.page.html(rows);
  },

  loadMyListings: async function() {
    let isAgent = App.isAgent();
    console.log(isAgent)
    App.showLoader();
    if(!isAgent){
      $('table').hide()
    }
    else {
      App.page.html('')
      await App.getDraftAgreements();
      App.draftAgreements = App.draftAgreements.filter(ag => ag.listing_id)
      let rows = App.draftAgreements.map(ag => {
        let button = ag.rented === true ? 
          `<button class="btn btn-success toggle-acceptance-page" 
          data-id="${ag._id}">View signed Agreement</button>`
          : `<button class="btn btn-primary btn-sign-agreement" 
          data-id="${ag._id}">Sign</button>`;
        return `<tr>
          <td>${ag.listing_id}</td>
          <td>${ag.title}</td>
          <td>${ag['agreement-rental-amount']}</td>
          <td>${button}</td>
        </tr>`
      })
      $('#tableBody').html(rows)
    }
  },

  handleAgreement: async function() {
    try {
      const agreementData = {
        'listing_id': App.pageAgreementForm.find('.btn-agreement').data('id'),
        'user_id': App.account ?? null,
        'title': App.pageAgreementForm.find('#agreement-listing-title').html(),
        'tenant': App.pageAgreementForm.find('#tenant').val(),
        'agreement-rental-start-date': App.pageAgreementForm.find('#agreement-rental-start-date').val(),
        'agreement-rental-amount': App.pageAgreementForm.find('#agreement-rental-amount').val(),
        'rental-duration': App.pageAgreementForm.find("select#rental-duration option").filter(":selected").val(),
        draft: true
      };
      await App.saveDraftAgreement(agreementData);
      $('#agreement-form').modal('hide')
      App.loadAllListings();
    }catch (error) {
      console.log(error);
      console.error("error in saving Agreement");
    }
  },

  saveDraftAgreement: async function(data) {
    await axios.post(`${PG_FIREBASE_DB}/agreements.json`, data);
  },

  signDraftAgreement: async function(id) {
    await axios.patch(`${PG_FIREBASE_DB}/agreements/${id}.json`, {
      draft: false,
      rented: true
    });
  },

  getDraftAgreements: async function() {
    try {
      const {data} = await axios.get(`${PG_FIREBASE_DB}/agreements.json`);
      App.draftAgreements = Object.keys(data).map(key => {
        return {
          _id: key,
          ...data[key]
        }
      });
    } catch(e) {
      console.log(e);
    }
  },
    
  showAgreementModel: async function(e) {
    const listingId = parseInt(e.target.dataset.listingId, 10);
    const listing = App.listings.find(i => i.id === listingId);
    // call the method to load the agreement
    App.populateAgreementForm(listing);
  },

  toggleAcceptancePage: function(e) {
    const id = e.target.dataset.id;
    const agreement = App.draftAgreements.find(ag => ag._id === id);
    App.pageAcceptance.find("#agreement-tenant .value").html(agreement.tenant);
    App.pageAcceptance.find("#agreement-rental-amount .value").html(agreement['agreement-rental-amount']);
    App.pageAcceptance.find("#agreement-rental-start-date .value").html(agreement['agreement-rental-start-date']);
    App.pageAcceptance.find("#agreement-rental-duration .value").html(agreement['rental-duration']);
    App.pageAcceptance.show();
  },

  initWeb3: async function() {
    // Modern dapp browsers...
    if (window.ethereum) {
      App.web3Provider = window.ethereum;
      try {
        // Request account access
        await window.ethereum.request({ method: "eth_requestAccounts" });
      } catch (error) {
        // User denied account access...
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
    $(document).on('click', '.toggle-acceptance-page', App.toggleAcceptancePage);
    $(document).on('click', '.btn-sign-agreement', App.signAgreement);
  },

  signAgreement: async function(e) {
    e.preventDefault();
    const id = $(this).data('id');
    const agreement = App.draftAgreements.find(i => i._id === id);
    await App.createAgreement(
        agreement.listing_id, 
        agreement['agreement-rental-amount'],
        agreement['agreement-rental-start-date'],  
        agreement['rental-duration'], 
        agreement['user_id'],
        'sg'
    );
    await App.signDraftAgreement(agreement._id);
  },

  createAgreement: async function(listingId, rent, startDate, duration, tenant, address) {
    await App.rentAgreement.createAgreement(listingId, rent, startDate, duration, tenant, address, { from: App.account });
  },

  getAgreement: async function(listingId) {
    await App.rentAgreement.agreements(listingId);
  },

  getAgreements: async function() {
    
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
