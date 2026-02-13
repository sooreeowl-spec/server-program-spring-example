package com.koreanit.spring.user;

import java.util.List;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.koreanit.spring.common.error.ApiException;
import com.koreanit.spring.common.error.ErrorCode;
import com.koreanit.spring.security.SecurityUtils;

@Service
public class UserService {

    private static final int MAX_LIMIT = 1000;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    private int normalizeLimit(int limit) {
        if (limit <= 0) {
            // throw new IllegalArgumentException("limit 은 1 이상 입력해주세요");
            throw new ApiException(ErrorCode.INVALID_REQUEST, "limit은 1 이상 입력해주세요.");
        }
        return Math.min(limit, MAX_LIMIT);
    }

    public boolean isSelf(Long userId) {
        Long currentUserId = SecurityUtils.currentUserId();
        return currentUserId != null && userId != null && currentUserId.equals(userId);
    }

    public Long create(String username, String password, String nickname, String email) {

        username = username.trim().toLowerCase();
        nickname = nickname.trim().toLowerCase();

        String normalizedEmail = (email == null) ? null : email.toLowerCase();

        String hash = passwordEncoder.encode(password);

        return userRepository.save(
                username,
                hash,
                nickname,
                normalizedEmail);
    }

    @PreAuthorize("hasRole('ADMIN') or @userService.isSelf(#id)")
    public User get(Long id) {
        try {
            UserEntity e = userRepository.findById(id);
            return UserMapper.toDomain(e);
        } catch (EmptyResultDataAccessException e) {
            throw new ApiException(ErrorCode.NOT_FOUND_RESOURCE, "유저 정보가 없습니다");
        }

    }

    @PreAuthorize("hasRole('ADMIN')")
    public List<User> list(int limit) {
        int safeLimit = normalizeLimit(limit);
        return UserMapper.toDomainList(userRepository.findAll(safeLimit));
    }

    @PreAuthorize("hasRole('ADMIN') or @userService.isSelf(#id)")
    public void changeNickname(Long id, String nickname) {
        nickname = nickname.trim().toLowerCase();
    }

    @PreAuthorize("hasRole('ADMIN') or @userService.isSelf(#id)")
    public void changePassword(Long id, String password) {

        User user = get(id);
        boolean ok = passwordEncoder.matches(password, user.getPassword());

        if (!ok) {
            throw new ApiException(ErrorCode.INVALID_REQUEST, "기존과 동일한 비밀번호입니다");
        }

        String hash = passwordEncoder.encode(password);

        userRepository.updatePassword(id, hash);
    }

    @PreAuthorize("hasRole('ADMIN') or @userService.isSelf(#id)")
    public void delete(Long id) {
        userRepository.deleteById(id);
    }

    @PreAuthorize("hasRole('ADMIN') or @userService.isSelf(#id)")
    public void changeEmail(Long id, String email) {
        String normalizedEmail = (email == null) ? null : email.toLowerCase();
        try {
            System.out.println(userRepository.updateEmail(id, normalizedEmail));
        } catch (DuplicateKeyException e) {
            throw new ApiException(ErrorCode.DUPLICATE_RESOURCE, "이메일이 중복되었습니다");
        }
    }

    public Long login(String username, String password) {
        UserEntity e = userRepository.findByUsername(username);

        boolean ok = passwordEncoder.matches(password, e.getPassword());
        if (!ok) {
            throw new ApiException(ErrorCode.INTERNAL_ERROR, "비밀번호 검증 실패");
        }

        return e.getId();
    }
}