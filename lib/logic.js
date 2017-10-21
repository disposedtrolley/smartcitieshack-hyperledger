'use strict';

function onCreateStorageRequest(createStorageRequest) {
	var assetRegistry
	var ns = 'org.stashit'
	var factory = getFactory()
	var totalCost = createStorageRequest.lendingPeriod * createStorageRequest.storageLocation.costPerPeriod
	var enoughFunds = createStorageRequest.requester.fundsAvailable >= totalCost
	var minPeriodReached = createStorageRequest.lendingPeriod >= createStorageRequest.storageLocation.minLendingPeriod
	if (enoughFunds && minPeriodReached) {
		getAssetRegistry(ns + '.ItemStorageRequest')
			.then(function(ar) {
				assetRegistry = ar
				var storageRequest = factory.newResource(ns, 'ItemStorageRequest', '1234')
				storageRequest.requester = createStorageRequest.requester
				storageRequest.provider = createStorageRequest.provider
				storageRequest.storageLocation = createStorageRequest.storageLocation
				storageRequest.itemsToStore = createStorageRequest.itemsToStore
				storageRequest.totalCost = createStorageRequest.storageLocation.costPerPeriod * createStorageRequest.lendingPeriod
				storageRequest.startDate = createStorageRequest.startDate
				storageRequest.lendingPeriod = createStorageRequest.lendingPeriod
				storageRequest.status = 'PENDING'
				return assetRegistry.add(storageRequest)
			})
	}
}

function onApproveStorageRequest(approveStorageRequest) {
	var assetRegistry
	var ns = 'org.stashit'
	var factory = getFactory()
	// vertify the current request is still pending and the requester has enough funds
	var requestStatus = approveStorageRequest.requestToApprove.status
	var enoughFunds = approveStorageRequest.requestToApprove.requester.fundsAvailable >= approveStorageRequest.requestToApprove.totalCost
	if (requestStatus === 'PENDING' && enoughFunds) {
		// charge the User
		getParticipantRegistry(ns + '.User')
			.then(function(ar) {
				assetRegistry = ar
				var totalCost = approveStorageRequest.requestToApprove.totalCost
				approveStorageRequest.requestToApprove.requester.fundsAvailable = approveStorageRequest.requestToApprove.requester.fundsAvailable - totalCost
				return assetRegistry.update(approveStorageRequest.requestToApprove.requester)
			})

		// update status of ItemStorageRequest
		getAssetRegistry(ns + '.ItemStorageRequest')
			.then(function(ar) {
				assetRegistry = ar
				approveStorageRequest.requestToApprove.status = 'APPROVED'
				return assetRegistry.update(approveStorageRequest.requestToApprove)
			})
		// create ItemStorageContract
		getAssetRegistry(ns + '.ItemStorageContract')
			.then(function(ar) {
				assetRegistry = ar
				var storageContract = factory.newResource(ns, 'ItemStorageContract', approveStorageRequest.requestToApprove.$identifier + '_contract')
				storageContract.approvedRequest = approveStorageRequest.requestToApprove
				storageContract.fulfillmentDate = new Date()
				return assetRegistry.add(storageContract)
			})
	}
}

function onDeclineStorageRequest(declineStorageRequest) {
	var assetRegistry
	var ns = 'org.stashit'
	var factory = getFactory()
	if (declineStorageRequest.requestToDecline.status === 'PENDING') {
		getAssetRegistry(ns + '.ItemStorageRequest')
			.then(function(ar) {
				assetRegistry = ar
				declineStorageRequest.requestToDecline.status = 'DECLINED'
				return assetRegistry.update(declineStorageRequest.requestToDecline)
			})
	}
}

function onCancelStorageRequest(cancelStorageRequest) {
	var assetRegistry
	var ns = 'org.stashit'
	var factory = getFactory()
	if (cancelStorageRequest.requestToCancel.status === 'PENDING') {
		getAssetRegistry(ns + '.ItemStorageRequest')
		.then(function(ar) {
			assetRegistry = ar
			cancelStorageRequest.requestToCancel.status = 'CANCELLED'
			return assetRegistry.update(cancelStorageRequest.requestToCancel)
		})
	}
}