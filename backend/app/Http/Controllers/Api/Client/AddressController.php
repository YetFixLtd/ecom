<?php

namespace App\Http\Controllers\Api\Client;

use App\Http\Controllers\Controller;
use App\Http\Requests\Client\StoreAddressRequest;
use App\Http\Requests\Client\UpdateAddressRequest;
use App\Http\Resources\Client\AddressResource;
use App\Models\User\Address;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Address Controller
 *
 * Handles address management for authenticated users.
 */
class AddressController extends Controller
{
    /**
     * List all addresses for the authenticated user.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $addresses = $request->user()->addresses()->orderBy('created_at', 'desc')->get();

        return response()->json([
            'data' => AddressResource::collection($addresses),
        ]);
    }

    /**
     * Store a new address for the authenticated user.
     *
     * @param StoreAddressRequest $request
     * @return JsonResponse
     */
    public function store(StoreAddressRequest $request): JsonResponse
    {
        $user = $request->user();

        // If setting as default billing, unset other default billing addresses
        if ($request->is_default_billing) {
            $user->addresses()->update(['is_default_billing' => false]);
        }

        // If setting as default shipping, unset other default shipping addresses
        if ($request->is_default_shipping) {
            $user->addresses()->update(['is_default_shipping' => false]);
        }

        $address = $user->addresses()->create($request->validated());

        return response()->json([
            'message' => 'Address created successfully.',
            'data' => new AddressResource($address),
        ], 201);
    }

    /**
     * Show a specific address.
     *
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $address = Address::where('user_id', $request->user()->id)->findOrFail($id);

        return response()->json([
            'data' => new AddressResource($address),
        ]);
    }

    /**
     * Update an address.
     *
     * @param UpdateAddressRequest $request
     * @param int $id
     * @return JsonResponse
     */
    public function update(UpdateAddressRequest $request, int $id): JsonResponse
    {
        $address = Address::where('user_id', $request->user()->id)->findOrFail($id);
        $user = $request->user();

        $data = $request->validated();

        // If setting as default billing, unset other default billing addresses
        if (isset($data['is_default_billing']) && $data['is_default_billing']) {
            $user->addresses()->where('id', '!=', $id)->update(['is_default_billing' => false]);
        }

        // If setting as default shipping, unset other default shipping addresses
        if (isset($data['is_default_shipping']) && $data['is_default_shipping']) {
            $user->addresses()->where('id', '!=', $id)->update(['is_default_shipping' => false]);
        }

        $address->update($data);

        return response()->json([
            'message' => 'Address updated successfully.',
            'data' => new AddressResource($address->fresh()),
        ]);
    }

    /**
     * Delete an address.
     *
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $address = Address::where('user_id', $request->user()->id)->findOrFail($id);

        $address->delete();

        return response()->json([
            'message' => 'Address deleted successfully.',
        ]);
    }

    /**
     * Set an address as default billing address.
     *
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function setDefaultBilling(Request $request, int $id): JsonResponse
    {
        $address = Address::where('user_id', $request->user()->id)->findOrFail($id);
        $user = $request->user();

        // Unset other default billing addresses
        $user->addresses()->where('id', '!=', $id)->update(['is_default_billing' => false]);

        // Set this address as default billing
        $address->update(['is_default_billing' => true]);

        return response()->json([
            'message' => 'Default billing address updated successfully.',
            'data' => new AddressResource($address->fresh()),
        ]);
    }

    /**
     * Set an address as default shipping address.
     *
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function setDefaultShipping(Request $request, int $id): JsonResponse
    {
        $address = Address::where('user_id', $request->user()->id)->findOrFail($id);
        $user = $request->user();

        // Unset other default shipping addresses
        $user->addresses()->where('id', '!=', $id)->update(['is_default_shipping' => false]);

        // Set this address as default shipping
        $address->update(['is_default_shipping' => true]);

        return response()->json([
            'message' => 'Default shipping address updated successfully.',
            'data' => new AddressResource($address->fresh()),
        ]);
    }
}
