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
    App.pageAgreementForm.find('.btn-agreement').data('id', listing.id);
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

  handleAgreement: async function() {
    try {
      const agreementData = {
        'listing_id': App.pageAgreementForm.find('.btn-agreement').data('id'),
        'user_id': App.user[0],
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
  },

  getAgreements: function() {

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

  initContract: function() {
    //NOTE: sample code, to be updated

    // $.getJSON('Adoption.json', function(data) {
    //   // Get the necessary contract artifact file and instantiate it with @truffle/contract
    //   var AdoptionArtifact = data;
    //   App.contracts.Adoption = TruffleContract(AdoptionArtifact);
    //
    //   // Set the provider for our contract
    //   App.contracts.Adoption.setProvider(App.web3Provider);
    //
    //   // Use our contract to retrieve and mark the adopted pets
    //   return App.markAdopted();
    // });

    return App.bindEvents();
  },

  bindEvents: function() {
    $(document).on('click', '.btn-adopt', App.handleAdopt);
    $(document).on('click', '.nav-homepage', App.loadAllListings);
    $(document).on('click', '.nav-my-listings', App.loadMyListings);
    $(document).on('click', '.btn-agreement', App.handleAgreement);
  },

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
