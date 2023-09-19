// SPDX-License-Identifier: MIT
pragma solidity >=0.8.7;

interface Tenet {
    function withdraw(address token, address user, uint256 amount) external;
}

contract Token  {
    uint256 private constant MAX_UINT256 = 2**256 - 1;
    mapping(address => uint256) public balances;
    uint256 public totalSupply;
    mapping(address => mapping(address => uint256)) public allowed;

    string public name;
    uint8 public decimals;
    string public symbol;

    constructor(
        uint8 _decimalUints,
        string memory _tokenName,
        string memory _totalSymbol
    ) {
        decimals = _decimalUints;
        name = _tokenName;
        symbol = _totalSymbol;
    }

    event Transfer(address indexed _from, address indexed _to, uint256 _value);
    event Approval(
        address indexed _owner,
        address indexed _spender,
        uint256 _value
    );

    function transfer(address _to, uint256 _value) public {
        require(
            balances[msg.sender] >= _value,
            "token balance is lower than the value requested"
        );
        balances[msg.sender] -= _value;
        balances[_to] += _value;
        emit Transfer(msg.sender, _to, _value);
    }

    function transferFrom(
        address _from,
        address _to,
        uint256 _value
    ) public {
        uint256 allowance = allowed[_from][msg.sender];
        require(
            balances[_from] >= _value && allowance >= _value,
            "token balance or allowance is lower than amount requested"
        );
        balances[_to] += _value;
        balances[_from] -= _value;
        if (allowance < MAX_UINT256) {
            allowed[_from][msg.sender] -= _value;
        }
        emit Transfer(_from, _to, _value); //solhint-disable-line indent, no-unused-vars
    }

    function balanceOf(address _owner) public view returns (uint256) {
        return balances[_owner];
    }

    function approve(address _spender, uint256 _value)
        public
        returns (bool success)
    {
        allowed[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value); //solhint-disable-line indent, no-unused-vars
        return true;
    }

    function allowance(address _owner, address _spender)
        public
        view
        returns (uint256 remaining)
    {
        return allowed[_owner][_spender];
    }

    function burn(address to, uint256 amount) public {
        require(
            balances[to] >= amount,
            "token balance is lower than the value requested"
        );

        balances[to] -= amount;
        totalSupply -= amount;
    }

    function mint(address to, uint256 amount) public {
        balances[to] += amount;
        totalSupply += amount;
    }
}

contract Tenet_L2 {
    address[] public allToken;
    mapping(address => Token) tokens;

    event Escrow(address indexed token, address indexed substrateToken);

    function escrow(
        address token,
        uint8 decimals,
        string calldata name,
        string calldata symbol
    ) public {
        require(
            address(tokens[token]) == address(0),
            "token has alread escrow"
        );

        Token t = new Token(decimals, name, symbol);
        tokens[token] = t;
        allToken.push(token);
        emit Escrow(token, address(t));
    }

    modifier onlyRegister(address token) {
        require(address(tokens[token]) != address(0), "token has not escrow");
        _;
    }

    function getToken(address token)
        public
        view
        returns (
            address substrateToken,
            string memory name,
            uint8 decimals,
            string memory symbol
        )
    {
        Token t = tokens[token];
        substrateToken = address(t);
        name = t.name();
        decimals = t.decimals();
        symbol = t.symbol();
    }

    event Mint(
        address indexed token,
        address indexed to,
        uint256 indexed amount
    );

    function mint(
        address token,
        address to,
        uint256 amount
    ) public onlyRegister(token) {
        Token t = tokens[token];
        t.mint(to, amount);
        emit Mint(token, to, amount);
    }

    event Withdraw(
        address indexed token,
        address indexed to,
        uint256 indexed amount
    );

    event Dispatch(bytes payload);

    function withdraw(address token, uint256 amount)
        public
        onlyRegister(token)
    {
        Token t = tokens[token];
        t.burn(msg.sender, amount);
        emit Dispatch(
            abi.encodeWithSelector(
                Tenet.withdraw.selector,
                token,
                msg.sender,
                amount
            )
        );
        // emit Withdraw(token, msg.sender, amount);
    }

    function getTokenSupply(address token)
        public
        view
        onlyRegister(token)
        returns (uint256)
    {
        return tokens[token].totalSupply();
    }
}