App = {
  web3Provider: null,
  contracts: {},
  user: null,
  page: $("#page-content"),
  pageAgreementForm: $("#agreement-form"),

  showLoader: () => {
    App.page.html("Loading...");
  },

  init: async function() {
    // load listings
    App.showLoader();
    await App.loadAllListings();
    return await App.initWeb3();
  },

  populateAgreementForm: function (listing) {
    App.pageAgreementForm.find('.listing-card img').attr('src', listing.media?.cover?.V550);
    App.pageAgreementForm.find('#agreement-listing-title').html(listing.localizedTitle);
    App.pageAgreementForm.find('#agreement-rental-amount').val(listing.price.pretty);
    App.pageAgreementForm.find('#agreement-landlord-name').val(listing.property.developer);
    
  },

  loadAllListings: async function() {
    const [listings, agents] = await Promise.all([
      $.getJSON('../listings.json'), 
      $.getJSON('../agents.json')
    ]);

    let cards = listings.map((i) => {
      let button = $(`<button class="btn btn-primary" data-listing-id="${i.id}">Rent</button>`);
      button.on('click', (e) => {
        let listingId = e.target.dataset.listingId;
        // call the method to load the agreement
        App.populateAgreementForm(i);
        App.page.replaceWith(App.pageAgreementForm.removeClass('hidden'));
      });

      let card = $(`<div class="col-sm-4">
        <div class="listing-card">
          <img src="${i.media?.cover?.V550}" />
          <h4>${i.localizedTitle}</h4>
        </div>
      </div>`);

      card.find('.listing-card').append(button);

      return card;
    });
    console.log(cards);

    let rows = $('<div class="row"></div>');
    rows.append(cards);

    App.page.html(rows);

    console.log('Listings: ', listings);
    console.log('Agents: ', agents);
  },

  loadMyListings: async function() {
    App.showLoader();
    console.log('My listing page: ');
  },

  initWeb3: async function() {
    // Modern dapp browsers...
    if (window.ethereum) {
      App.web3Provider = window.ethereum;
      try {
        // Request account access
        App.user = await window.ethereum.request({ method: "eth_requestAccounts" });
        console.log('Logged in user: ' +  App.user);
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

    return App.initContract();

  },

  initContract: async function() {
    const rentAgreement = await $.getJSON('RentAgreement.json');
    App.contracts.RentalAgreement = TruffleContract(rentAgreement);
    App.contracts.RentalAgreement.setProvider(App.web3Provider);
    App.rentAgreement = await App.contracts.RentalAgreement.deployed();

    return App.bindEvents();
  },

  bindEvents: function() {
    $(document).on('click', '.nav-homepage', App.loadAllListings);
    $(document).on('click', '.nav-my-listings', App.loadMyListings);

    App.sampleFunc();
  },

  sampleFunc: async function() {
    await App.rentAgreement.testFunc();
  }

  //NOTE: Sample code, to be removed

  // markAdopted: function() {
  //   var adoptionInstance;
  //
  //   App.contracts.Adoption.deployed().then(function(instance) {
  //     adoptionInstance = instance;
  //
  //     return adoptionInstance.getAdopters.call();
  //   }).then(function(adopters) {
  //     for (i = 0; i < adopters.length; i++) {
  //       if (adopters[i] !== '0x0000000000000000000000000000000000000000') {
  //         $('.panel-pet').eq(i).find('button').text('Success').attr('disabled', true);
  //       }
  //     }
  //   }).catch(function(err) {
  //     console.log(err.message);
  //   });
  //
  // },
  //
  // handleAdopt: function(event) {
  //   event.preventDefault();
  //
  //   var petId = parseInt($(event.target).data('id'));
  //
  //   var adoptionInstance;
  //
  //   web3.eth.getAccounts(function(error, accounts) {
  //     if (error) {
  //       console.log(error);
  //     }
  //
  //     var account = accounts[0];
  //
  //     App.contracts.Adoption.deployed().then(function(instance) {
  //       adoptionInstance = instance;
  //
  //       // Execute adopt as a transaction by sending account
  //       return adoptionInstance.adopt(petId, { from: account });
  //     }).then(function(result) {
  //       return App.markAdopted();
  //     }).catch(function(err) {
  //       console.log(err.message);
  //     });
  //   });
  // }
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
