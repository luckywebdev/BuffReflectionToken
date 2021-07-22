// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.4;

import "./utils/IERC20.sol";
import "./utils/Ownable.sol";
import "./utils/SafeMath.sol";
import "./utils/TimeLock.sol";

/**
 * @notice ERC20 token PreSale contract
 */
contract PreSaleBuff is Ownable, TimeLock {
    using SafeMath for uint256;

    IERC20 private _buffToken;

    // Address where funds are collected
    address payable public _wallet;

    // How many token units a buyer gets per wei
    uint256 public _rate;

    // Amount of wei raised
    uint256 public _weiRaised;

    // Amount of token released
    uint256 public _tokenReleased;

    bool private _paused;

    /**
    * Event for token purchase logging
    * @param purchaser who paid for the tokens
    * @param beneficiary who got the tokens
    * @param value weis paid for purchase
    * @param amount amount of tokens purchased
    */
    event TokenPurchase(
        address indexed purchaser,
        address indexed beneficiary,
        uint256 value,
        uint256 amount
    );
    constructor (address buffToken, uint rate, address payable wallet) {
        require(rate > 0);
        require(wallet != address(0));
        require(buffToken != address(0));
        _buffToken = IERC20(buffToken);
        _rate = rate;
        _wallet = wallet;
        _paused = true;
    }

    /**
     * @dev modifier for mint or burn limit
     */
    modifier isNotPaused() {
        require(_paused == false, "ERR: paused already");
        _;
    }

    function pausedEnable() external onlyOwner returns (bool) {
        require(_paused == false, "ERR: already pause enabled");
        _paused = true;
        return true;
    }

    function pausedNotEnable() external onlyOwner returns (bool) {
        require(_paused == true, "ERR: already pause disabled");
        _paused = false;
        return true;
    }

    receive() external payable {
        buyTokens(msg.sender);
    }


    function buyTokens(address _beneficiary) public payable isNotPaused {
        uint256 weiAmount = msg.value;
        _preValidatePurchase(_beneficiary, weiAmount);

        // calculate token amount to be created
        uint256 tokens = _getTokenAmount(weiAmount);

        // update state
        _weiRaised = _weiRaised.add(weiAmount);

        _processPurchase(_beneficiary, tokens);
        emit TokenPurchase(
            msg.sender,
            _beneficiary,
            weiAmount,
            tokens
        );

        _updatePurchasingState(_beneficiary);

        _forwardFunds();
        // _postValidatePurchase(_beneficiary, weiAmount);
    }

    // -----------------------------------------
    // Internal interface (extensible)
    // -----------------------------------------

    /**
    * @dev Validation of an incoming purchase. Use require statements to revert state when conditions are not met. Use super to concatenate validations.
    * @param _beneficiary Address performing the token purchase
    * @param _weiAmount Value in wei involved in the purchase
    */
    function _preValidatePurchase(
        address _beneficiary,
        uint256 _weiAmount
    )
        internal
    {
        require(_beneficiary != address(0));
        require(_weiAmount != 0);
        require(_weiAmount <= 1 ether, 'ERR: Exceed presale plan ETH');
        require(_weiAmount >= 0.1 ether, 'ERR: So less presale plan ETH');
        uint256 tokenBalance = _buffToken.balanceOf(address(this));
        uint256 tokens = _getTokenAmount(_weiAmount);
        require(tokens <= tokenBalance, 'ERR: Exceed presale plan');
        if(isLocked(_beneficiary)) {
            lockedRelease(_beneficiary);
        }
    }

    /**
    * @dev Validation of an executed purchase. Observe state and use revert statements to undo rollback when valid conditions are not met.
    * @param _beneficiary Address performing the token purchase
    * @param _weiAmount Value in wei involved in the purchase
    */
    function _postValidatePurchase(
        address _beneficiary,
        uint256 _weiAmount
    )
        internal
    {
        // optional override
    }

    /**
    * @dev Source of tokens. Override this method to modify the way in which the crowdsale ultimately gets and sends its tokens.
    * @param _beneficiary Address performing the token purchase
    * @param _tokenAmount Number of tokens to be emitted
    */
    function _deliverTokens(
        address _beneficiary,
        uint256 _tokenAmount
    )
        internal
    {
        _buffToken.transfer(_beneficiary, _tokenAmount);
    }

    /**
    * @dev Executed when a purchase has been validated and is ready to be executed. Not necessarily emits/sends tokens.
    * @param _beneficiary Address receiving the tokens
    * @param _tokenAmount Number of tokens to be purchased
    */
    function _processPurchase(
        address _beneficiary,
        uint256 _tokenAmount
    )
        internal
    {
        _deliverTokens(_beneficiary, _tokenAmount);
    }

    /**
    * @dev Override for extensions that require an internal state to check for validity (current user contributions, etc.)
    * @param _beneficiary Address receiving the tokens
    */
    function _updatePurchasingState(
        address _beneficiary
    )
        internal
    {
        lockAddress(_beneficiary, uint64(10 minutes));
    }

    /**
    * @dev Override to extend the way in which ether is converted to tokens.
    * @param _weiAmount Value in wei to be converted into tokens
    * @return Number of tokens that can be purchased with the specified _weiAmount
    */
    function _getTokenAmount(uint256 _weiAmount)
        internal view returns (uint256)
    {
        return _weiAmount.mul(_rate);
    }

    /**
    * @dev Determines how ETH is stored/forwarded on purchases.
    */
    function _forwardFunds() internal {
        _wallet.transfer(msg.value);
    }

    function setRate(uint rate) public onlyOwner isNotPaused {
        require(rate > 0, 'ERR: zero rate');
        _rate = rate;
    }
}